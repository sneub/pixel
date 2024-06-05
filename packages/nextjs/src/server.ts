import { NextRequest, NextResponse } from 'next/server';
import { mintJwt, verifyToken, TokenPayload } from './jwt';

const random = () => Math.floor(Math.random() * 10000000000) + Date.now();

export class Pixel {
  private jwtSecret: string | undefined;
  private adapter: Adapter;

  constructor(adapter: Adapter) {
    this.jwtSecret = process.env.PIXEL_JWT_SECRET;
    this.adapter = adapter;

    if (!process.env.PIXEL_JWT_SECRET) {
      throw new Error('Missing Pixel JWT secret');
    }
  }

  async identify({
    email,
    name,
    image,
    userId,
    data,
  }: {
    email: string;
    name?: string;
    image?: string;
    userId?: string;
    data?: any;
  }) {
    const payload: TokenPayload = {
      email,
      name,
      image,
      userId,
      data,
      random: random(), // add a random number to the payload to make it unique
    };

    const jwt = await mintJwt(this.jwtSecret, payload);
    return jwt;
  }

  async track(
    event: string,
    anonymousId?: string,
    optional?: { user?: TokenPayload; data?: any },
  ) {
    let { user, data } = optional || {
      user: undefined,
      anonymousId: undefined,
      data: undefined,
    };

    if (user) {
      user = { ...user, anonymousId };
      this.adapter.saveUser(user);
    } else {
      // Add this fallback for anonymous server-side events
      user = { anonymousId: anonymousId || '0' };
    }
    this.adapter.saveEvent(user, event, data);
  }
}

export default Pixel;

class Adapter {
  async saveEvent(user: TokenPayload, event: string, data?: any) {}
  async saveUser(user: TokenPayload) {}
}

export class PrismaAdapter extends Adapter {
  private prismaClient: any;

  constructor(prismaClient: any) {
    super();
    this.prismaClient = prismaClient;
  }

  async saveEvent(user: TokenPayload, event: string, data?: any) {
    await this.prismaClient.event.create({
      data: {
        event,
        data,
        user: {
          connectOrCreate: {
            where: { email: user.email },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
              data: user.data,
            },
          },
        },
      },
    });
  }

  async saveUser(user: TokenPayload) {
    await this.prismaClient.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        image: user.image,
        data: user.data,
      },
      create: {
        email: user.email,
        name: user.name,
        image: user.image,
        data: user.data,
      },
    });
  }
}

export class BigQueryAdapter extends Adapter {
  private bqClient: any;

  constructor(bqClient: any) {
    super();
    this.bqClient = bqClient;
  }

  async saveEvent() {
    // save the event to BigQuery
  }

  async saveUser() {
    // save the user to the database
  }
}

export class RedisAdapter extends Adapter {
  private redisClient: any;

  constructor(redisClient: any) {
    super();
    this.redisClient = redisClient;
  }

  async saveEvent() {
    // save the event to Redis
  }

  async saveUser() {
    // save the user to the database
  }
}

// https://www.june.so/docs/tracking/server/node-js
interface JuneEventPayload {
  userId?: string;
  anonymousId?: string;
  event: string;
  properties?: any;
  timestamp?: string;
  context?: any;
}

export class JuneAdapter extends Adapter {
  private juneClient: any;

  constructor(juneClient: any) {
    super();
    this.juneClient = juneClient;
  }

  async saveEvent(user: TokenPayload, event: string, properties?: any) {
    const eventPayload: JuneEventPayload = {
      // Using email as a fallback because AuthJS does
      // not provide a userId by default in the session object
      userId: user.userId || user.email,
      anonymousId: user.anonymousId,
      event,
      properties,
    };

    this.juneClient.track(eventPayload);
  }

  async saveUser(user: TokenPayload) {
    const { userId, email, name, image, ...other } = user;
    this.juneClient.identify({
      // Using email as a fallback because AuthJS does
      // not provide a userId by default in the session object
      userId: userId || email,
      traits: {
        email: email,
        name: name,
        avatar: image,
        ...other,
      },
    });
  }
}

export class ConsoleAdapter extends Adapter {
  async saveEvent(user: TokenPayload, event: string, data?: any) {
    console.log('Event:', event, data);
  }

  async saveUser(user: TokenPayload) {
    console.log('User:', user);
  }
}

// API route handlers (app router)

export function handlers(pixel: Pixel) {
  return {
    POST: async (request: NextRequest) => {
      const { id, anonymousId, action, event, data } =
        (await request.json()) as HandlerPayload;

      switch (action) {
        case 'track':
          if (id) {
            const { email, userId, name, image } = await verifyToken(id);
            pixel.track(event, anonymousId, {
              user: { email, userId, name, image },
              data,
            });
          } else {
            // If the user has not been identified yet
            pixel.track(event, anonymousId, { data });
          }
          return NextResponse.json({ status: 'OK' });
        case 'identify':
          const jwt = await pixel.identify(data);
          return NextResponse.json({ status: 'OK', jwt });
      }
    },
  };
}

interface HandlerPayload {
  id: string;
  anonymousId: string;
  action: string;
  event: string;
  data?: any;
}
