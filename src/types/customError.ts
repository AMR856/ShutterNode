import { HttpStatusText } from "./HTTPStatusText";

export default class CustomError extends Error {
  statusCode: number;
  statusText: string;
  isJoi?: boolean;
  constructor(message: string, statusCode: number = 500, statusText: string = HttpStatusText.FAIL) {
    super(message);
    this.statusCode = statusCode;
    this.statusText = statusText;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
