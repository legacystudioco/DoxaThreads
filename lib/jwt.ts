import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Create a token (e.g. for printer settlement links)
export function signJwt(
  payload: object,
  expiresIn: string | number = "7d"
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Verify and decode a token
export function verifyJwt<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}