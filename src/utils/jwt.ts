import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(user: { id: number; username: string }) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
