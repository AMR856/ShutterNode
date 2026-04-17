import { Router } from "express";
import { ImageController } from "./image.controller";
import { auth } from "../../middlewares/auth";
import { upload } from "../../storage/multer";
import { validate } from "../../middlewares/validate";
import { ImageValidationSchemas } from "./image.validation";

const router = Router();

router.post("/", auth, upload.single("image"), ImageController.upload);

router.post(
  "/transform",
  validate({
    query: ImageValidationSchemas.transformQuery,
    body: ImageValidationSchemas.transformBody,
  }),
  ImageController.transform,
);

router.get(
  "/get-image",
  validate({ query: ImageValidationSchemas.publicIdParam }),
  ImageController.get,
);

router.get(
  "/:id/status",
  validate({ params: ImageValidationSchemas.statusIdParam }),
  ImageController.getUploadStatus,
);

router.get(
  "/",
  auth,
  validate({ query: ImageValidationSchemas.paginationQuery }),
  ImageController.getImages,
);

export default router;
