import { z } from "zod";

export class ImageValidationSchemas {
  static publicIdParam = z.object({
    publicId: z.string().min(1, "publicId is required"),
  });

  static statusIdParam = z.object({
    id: z.string().min(1, "Image upload ID is required"),
  });

  static paginationQuery = z.object({
    page: z
      .preprocess((val) => Number(val), z.number().int().positive())
      .default(1),
    limit: z
      .preprocess((val) => Number(val), z.number().int().positive())
      .default(10),
  });

  static transformQuery = z.object({
    id: z.string().min(1, "Image id is required"),
  });

  static transformBody = z.object({
    transformations: z
      .object({
        resize: z
          .object({
            width: z.number().int().positive().optional(),
            height: z.number().int().positive().optional(),
            crop: z
              .enum(["fill", "fit", "limit", "pad", "scale", "thumb"])
              .optional(),
            gravity: z
              .enum([
                "auto",
                "face",
                "faces",
                "center",
                "north",
                "south",
                "east",
                "west",
                "north_east",
                "north_west",
                "south_east",
                "south_west",
              ])
              .optional(),
            zoom: z.number().optional(),
          })
          .optional(),

        rotate: z.number().int().optional(),

        flip: z
          .enum(["horizontal", "vertical", "both"])
          .optional(),

        format: z
          .enum(["jpg", "png", "webp", "avif", "gif", "pdf", "auto"])
          .optional(),

        fetchFormat: z.enum(["auto"]).optional(),

        quality: z.union([z.number().positive(), z.literal("auto")]).optional(),
        dpr: z.number().positive().optional(),

        adjustments: z
          .object({
            brightness: z.number().optional(),
            contrast: z.number().optional(),
            saturation: z.number().optional(),
            hue: z.number().optional(),
            vibrance: z.number().optional(),
            gamma: z.number().optional(),
            sharpen: z.number().optional(),
            unsharpMask: z.number().optional(),
          })
          .optional(),

        filters: z
          .object({
            grayscale: z.boolean().optional(),
            sepia: z.boolean().optional(),
            negate: z.boolean().optional(),
            blur: z.number().optional(),
            pixelate: z.number().optional(),
            vignette: z.number().optional(),
            oilPaint: z.number().optional(),
            cartoonify: z.union([z.boolean(), z.number()]).optional(),
            art: z.string().optional(),
          })
          .optional(),

        radius: z.union([z.number(), z.literal("max")]).optional(),

        border: z
          .object({
            width: z.number().int().nonnegative(),
            color: z.string().min(1),
          })
          .optional(),

        background: z.string().optional(),

        watermark: z
          .object({
            text: z.string().min(1),
            fontFamily: z.string().optional(),
            fontSize: z.number().positive().optional(),
            fontColor: z.string().optional(),
            gravity: z
              .enum([
                "center",
                "north",
                "south",
                "east",
                "west",
                "north_east",
                "north_west",
                "south_east",
                "south_west",
              ])
              .optional(),
            opacity: z.number().min(0).max(100).optional(),
            x: z.number().optional(),
            y: z.number().optional(),
          })
          .optional(),
      })
      .refine(
        (data) =>
          !!data.resize ||
          data.rotate !== undefined ||
          !!data.flip ||
          !!data.format ||
          !!data.fetchFormat ||
          data.quality !== undefined ||
          data.dpr !== undefined ||
          !!data.adjustments ||
          !!data.filters ||
          data.radius !== undefined ||
          !!data.border ||
          !!data.background ||
          !!data.watermark,
        {
          message: "At least one transformation must be provided",
        }
      ),
  });
}
