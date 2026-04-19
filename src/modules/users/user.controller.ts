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

      // ! current arch doesn't not use this cookie, but it's here for future use when we decide to switch to cookie-based auth
      res.cookie("token", result.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
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
