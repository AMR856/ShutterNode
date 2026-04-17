import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import CustomError from "../types/customError";
import { HttpStatusText } from "../types/HTTPStatusText";

type LimiterOptions = {
  windowMs: number;
  max: number;
  message: string;
};

export class RateLimiter {
  private limiters: Map<string, RateLimitRequestHandler> = new Map();

  createLimiter(key: string, options: LimiterOptions) {
    if (this.limiters.has(key))
      throw new Error(`Limiter for ${key} already exists`);

    const limiter = rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: options.message,
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.limiters.set(key, limiter);
    return limiter;
  }

  getLimiter(key: string) {
    const limiter = this.limiters.get(key);
    if (!limiter)
      throw new CustomError(
        `Limiter for ${key} does not exist`,
        500,
        HttpStatusText.ERROR,
      );
    return limiter;
  }
}

export const limiter = new RateLimiter();

limiter.createLimiter("login", {
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 1000 : 10,
  message: "Too many login attempts, please try again later",
});

limiter.createLimiter("register", {
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 1000 : 10,
  message: "Too many registration attempts, please try again later",
});

limiter.createLimiter("profile", {
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 1000 : 10,
  message: "Too many profile requests, slow down!",
});
