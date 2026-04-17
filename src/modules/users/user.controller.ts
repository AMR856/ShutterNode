import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { AuthInput } from "./user.validation";

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.register(res.locals.body as AuthInput);

      res.status(201).json({
        status: HttpStatusText.SUCCESS,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.login(res.locals.body as AuthInput);
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.SAME_SITE
          ? (process.env.SAME_SITE as "lax" | "strict" | "none")
          : "none",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({
        status: HttpStatusText.SUCCESS,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = res.locals.user;
      const userId = Number(currentUser?.id ?? currentUser?.sub ?? currentUser);

      if (!userId) {
        throw new CustomError("Unauthorized", 401, HttpStatusText.FAIL);
      }

      const user = await UserService.profile(userId);

      res.json({
        status: HttpStatusText.SUCCESS,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
}
