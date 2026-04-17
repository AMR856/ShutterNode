import jwt, { JwtPayload } from "jsonwebtoken";
import CustomError from "../types/customError";
import { HttpStatusText } from "../types/HTTPStatusText";
import { UserModel } from "../modules/users/user.model";

export async function verifyToken(token?: string) {
  if (!token)
    throw new CustomError("You are not logged in", 401, HttpStatusText.FAIL);

  if (!process.env.JWT_SECRET)
    throw new CustomError(
      "JWT_SECRET is not defined",
      500,
      HttpStatusText.ERROR,
    );

  let decodedToken: JwtPayload;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new CustomError("Invalid or expired token", 401, HttpStatusText.FAIL);
  }
  const user = await UserModel.findById(decodedToken.id);
  if (!user)
    throw new CustomError(
      "The user belonging to this token no longer exists",
      401,
      HttpStatusText.FAIL,
    );

  if (!decodedToken.iat) {
    throw new CustomError("Invalid token payload", 401, HttpStatusText.FAIL);
  }

  return user;
}
