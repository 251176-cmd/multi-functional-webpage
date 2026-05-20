import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '@/src/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: User['role'];
};

/**
 * Extracts a bearer token from the request Authorization header.
 * 
 * @param {Request} request - Incoming API request
 * @returns {string | null} Bearer token or null if missing/invalid format
 */
export function getBearerToken(request: Request): string | null {
  // Step 1: Read Authorization header value
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  // Step 2: Ensure header uses the Bearer scheme
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  // Step 3: Return the parsed token
  return token;
}

/**
 * Verifies a JWT and validates the expected payload shape.
 * 
 * @param {string} token - JWT string from the Authorization header
 * @returns {AuthTokenPayload} Verified and validated payload
 */
export function verifyUserToken(token: string): AuthTokenPayload {
  // Step 1: Verify token signature and decode payload
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token');
  }

  // Step 2: Validate required payload fields
  const payload = decoded as JwtPayload;
  const userId = typeof payload.userId === 'string' ? payload.userId : null;
  const email = typeof payload.email === 'string' ? payload.email : null;
  const role = payload.role === 'user' || payload.role === 'admin' ? payload.role : null;
  if (!userId || !email || !role) {
    throw new Error('Invalid token');
  }

  // Step 3: Return normalized payload
  return { userId, email, role };
}

/**
 * Requires a valid user JWT on the request.
 * 
 * @param {Request} request - Incoming API request
 * @returns {AuthTokenPayload} Verified and validated payload
 */
export function requireUserAuth(request: Request): AuthTokenPayload {
  // Step 1: Extract bearer token from headers
  const token = getBearerToken(request);
  if (!token) {
    throw new Error('Unauthorized');
  }

  // Step 2: Verify token and payload
  const payload = verifyUserToken(token);

  // Step 3: Return verified payload for downstream use
  return payload;
}

