import { Router } from "express";
import { UserController } from "./user.controller";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { AuthValidationSchemas } from "./user.validation";
import { limiter } from "../../utils/rateLimiter";

const router = Router();

router.post(
  "/register",
  validate({ body: AuthValidationSchemas.authSchema }),
  limiter.getLimiter("register"),
  UserController.register,
);
router.post(
  "/login",
  validate({ body: AuthValidationSchemas.authSchema }),
  limiter.getLimiter("login"),
  UserController.login,
);
router.get(
  "/profile",
  auth,
  limiter.getLimiter("profile"),
  UserController.profile,
);

export default router;
