import { Request, Response, NextFunction } from "express";
import CustomError from '../types/customError';

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  let statusCode = err.statusCode ?? 500;
  let message = err.message ?? "Internal Server Error";
  if (err.isJoi) statusCode = 400;
  if (err.name === "JsonWebTokenError") statusCode = 401;

  res.status(statusCode).json({
    status: "error",
    message,
  });
};
