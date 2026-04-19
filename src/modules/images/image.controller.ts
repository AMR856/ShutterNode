import { Request, Response, NextFunction } from "express";
import { ImageService } from "./image.service";
import { HttpStatusText } from "../../types/HTTPStatusText";
import CustomError from "../../types/customError";

export class ImageController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new CustomError("No image uploaded", 400, HttpStatusText.FAIL);
      }

      const currentUser = res.locals.user;
      // For backward compatibility, we check both id and sub fields for user ID 
      // (If the token was signed with sub as user ID, we use that, otherwise we fall back to id)
      const userId = Number(currentUser?.id ?? currentUser?.sub ?? currentUser);

      if (!Number.isInteger(userId) || userId <= 0) {
        throw new CustomError("Unauthorized", 401, HttpStatusText.FAIL);
      }

      const result = await ImageService.uploadImage(
        req.file as Express.Multer.File,
        userId,
      );

      res.status(202).json({
        status: HttpStatusText.SUCCESS,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const publicId =
        ((req.query.publicId as string) ||
          (req.params.publicId as string) ||
          "").trim();

      if (!publicId) {
        throw new CustomError("publicId is required", 400, HttpStatusText.FAIL);
      }

      const url = await ImageService.getImage(publicId);

      res.json({
        status: HttpStatusText.SUCCESS,
        data: { url },
      });
    } catch (err) {
      next(err);
    }
  }

  static async transform(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (res.locals.query as { id?: string }) || req.query;
      const body = (res.locals.body as { transformations?: any }) || req.body;

      const id = String(query.id || "");
      if (!id) {
        throw new CustomError("image id is required", 400, HttpStatusText.FAIL);
      }

      const transformations = body.transformations;

      const result = await ImageService.transform(transformations, id);
      const url =
        typeof result === "string"
          ? result
          : (result as { url?: string }).url;

      res.json({
        status: HttpStatusText.SUCCESS,
        data: {
          imageId: id,
          url,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getImages(req: Request, res: Response, next: NextFunction) {
    try {
      const query =
        (res.locals.query as { page?: number; limit?: number }) || req.query;
      const page = Number(query.page || 1);
      const limit = Number(query.limit || 10);

      if (!Number.isInteger(page) || page <= 0) {
        throw new CustomError("Invalid page parameter", 400, HttpStatusText.FAIL);
      }

      if (!Number.isInteger(limit) || limit <= 0) {
        throw new CustomError("Invalid limit parameter", 400, HttpStatusText.FAIL);
      }

      const currentUser = res.locals.user;
      const userId = Number(currentUser?.id ?? currentUser?.sub ?? currentUser);

      if (!Number.isInteger(userId) || userId <= 0) {
        throw new CustomError("Unauthorized", 401, HttpStatusText.FAIL);
      }

      const images = await ImageService.getImages(userId, page, limit);

      res.status(200).json({
        status: HttpStatusText.SUCCESS,
        page,
        limit,
        count: images.length,
        data: images,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUploadStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const params = (res.locals.params as { id?: string }) || req.params;
      const id = params?.id;

      const status = await ImageService.getUploadStatus(id as string);

      res.json({
        status: HttpStatusText.SUCCESS,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }
}
