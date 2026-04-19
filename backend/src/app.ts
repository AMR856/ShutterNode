import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import userRouter from "./modules/users/user.route";
import imageRouter from "./modules/images/image.route";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./utils/errorHandler";
import { HttpStatusText } from "./types/HTTPStatusText";
import CustomError from "./types/customError";

const allowedOrigins = ["http://localhost:3000"]; // Stills needs to be updated to include the actual frontend URL in production
const app = express();

app.use(requestLogger);

app.use(helmet());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else
        callback(
          new CustomError("Not allowed by CORS", 403, HttpStatusText.FAIL),
        );
    },
    credentials: true,
  }),
);

app.use("/api/auth", userRouter);
app.use("/api/images", imageRouter);

app.use((req, res) => {
  res.status(404).json({
    status: HttpStatusText.FAIL,
    message: "Endpoint not found",
  });
});

app.use(errorHandler);

export default app;
