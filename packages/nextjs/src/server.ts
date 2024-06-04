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

  async track(event: string, optional?: { user?: TokenPayload; data?: any }) {
    let { user, data } = optional || { user: undefined, data: undefined };

    if (!user) {
      user = { email: 'anonymous' };
    }
    this.adapter.saveEvent(user, event, data);
    this.adapter.saveUser(user);
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

  async saveEvent() {
    // save the event to the database
  }

  async saveUser() {
    // save the user to the database
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

export class JuneAdapter extends Adapter {
  private juneClient: any;

  constructor(juneClient: any) {
    super();
    this.juneClient = juneClient;
  }

  async saveEvent() {
    // save the event to June
  }

  async saveUser() {
    // save the user to the database
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
      const { id, action, event, data } =
        (await request.json()) as HandlerPayload;

      switch (action) {
        case 'track':
          if (id) {
            const { email, userId, name, image } = await verifyToken(id);
            pixel.track(event, { user: { email, userId, name, image }, data });
          } else {
            // If the user has not been identified yet
            pixel.track(event, { data });
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
  action: string;
  event: string;
  data?: any;
}
