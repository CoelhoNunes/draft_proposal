import { createHmac, timingSafeEqual } from 'crypto';

type ExpiresIn = string | number;

type JwtPayload = Record<string, unknown> & {
  exp?: number;
  iat?: number;
};

interface SignOptions {
  expiresIn?: ExpiresIn;
}

function base64UrlEncode(data: Buffer): string {
  return data.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(segment: string): Buffer {
  segment = segment.replace(/-/g, '+').replace(/_/g, '/');
  while (segment.length % 4 !== 0) {
    segment += '=';
  }
  return Buffer.from(segment, 'base64');
}

function parseExpiresIn(expiresIn: ExpiresIn | undefined): number | undefined {
  if (expiresIn === undefined) {
    return undefined;
  }

  if (typeof expiresIn === 'number') {
    return expiresIn;
  }

  const match = /^([0-9]+)([smhd])$/.exec(expiresIn.trim());
  if (!match) {
    throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return value * multipliers[unit];
}

export function sign(payload: Record<string, unknown>, secret: string, options: SignOptions = {}): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);

  const body: JwtPayload = {
    ...payload,
    iat: issuedAt,
  };

  const expiresInSeconds = parseExpiresIn(options.expiresIn);
  if (expiresInSeconds) {
    body.exp = issuedAt + expiresInSeconds;
  }

  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(body)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${signingInput}.${encodedSignature}`;
}

export function verify<T extends JwtPayload = JwtPayload>(token: string, secret: string): T {
  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new Error('Invalid token');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expected = createHmac('sha256', secret).update(signingInput).digest();
  const actual = base64UrlDecode(encodedSignature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as T;
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired');
  }

  return payload;
}
