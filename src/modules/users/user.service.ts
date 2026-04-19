import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "./user.model";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { AuthInput } from "./user.validation";
import { StringValue } from "ms";

export class UserService {
  static async register(data: AuthInput) {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      throw new CustomError("User already exists", 409, HttpStatusText.FAIL);
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await UserModel.create({
      email: data.email,
      password: hashed,
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  static async login(data: AuthInput) {
    const user = await UserModel.findByEmail(data.email);
    if (!user) {
      throw new CustomError("Invalid credentials", 401, HttpStatusText.FAIL);
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new CustomError("Invalid credentials", 401, HttpStatusText.FAIL);
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN as StringValue) || "1d";
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn },
    );

    return { token };
  }

  static async profile(userId: number) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new CustomError("User not found", 404, HttpStatusText.FAIL);
    }
    return user;
  }
}
