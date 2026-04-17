import { Request, Response, NextFunction } from "express";
import { ImageService } from "./image.service";
import { HttpStatusText } from "../../types/HTTPStatusText";

export class ImageController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = res.locals.user;
      // For backward compatibility, we check both id and sub fields for user ID 
      // (If the token was signed with sub as user ID, we use that, otherwise we fall back to id)
      const userId = Number(currentUser?.id ?? currentUser?.sub ?? currentUser);

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
      const publicId = req.query.publicId as string;

      console.log("Fetching image with public ID:", publicId);
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
      const transformations = body.transformations;

      const url = await ImageService.transform(transformations, id);

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

      const currentUser = res.locals.user;
      const userId = Number(currentUser?.id ?? currentUser?.sub ?? currentUser);

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
