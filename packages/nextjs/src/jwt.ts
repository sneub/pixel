import { importJWK, JWK, SignJWT, jwtVerify } from 'jose';

export interface TokenPayload {
  email?: string;
  userId?: string;
  anonymousId?: string;
  name?: string;
  image?: string;
  data?: any;
  [other: string]: unknown;
}

export async function mintJwt(
  secret: string,
  payload: TokenPayload,
): Promise<string | null> {
  try {
    const secretJWK: JWK = {
      kty: 'oct',
      k: Buffer.from(secret).toString('base64'),
      alg: 'HS256',
    };

    const key = await importJWK(secretJWK, 'HS256');

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8760h')
      .sign(key);

    return token;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const jwtSecret = process.env.PIXEL_JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('Missing Pixel JWT secret');
  }

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(jwtSecret),
  );
  return payload as unknown as TokenPayload;
}
