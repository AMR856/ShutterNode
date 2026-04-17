import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/verifyToken";
import { HttpStatusText } from "../types/HTTPStatusText";

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : undefined;
    const token = cookieToken || bearerToken;
    const user = await verifyToken(token);
    res.locals.user = user;
    next();
  } catch (err: any) {
    res.status(err.statusCode || 401).json({
      status: HttpStatusText.FAIL,
      message: err.message || "Unauthorized",
    });
  }
}
