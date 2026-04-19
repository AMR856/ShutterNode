import { Request, Response, NextFunction } from "express";
import { ImageController } from "./image.controller";
import { ImageService } from "./image.service";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { afterEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../../config/cloudinary", () => ({
  uploader: { upload_stream: jest.fn() },
  url: jest.fn(),
}));

jest.mock("../../cache/redis", () => ({
  redis: { get: jest.fn(), set: jest.fn(), quit: jest.fn() },
  getTransformKey: jest.fn(),
}));

jest.mock("../../queue/bullmq", () => ({
  publishTransformJob: jest.fn(),
}));

interface HttpError {
  statusCode: number;
  message?: string;
}

const makeResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    locals: {},
  } as unknown as Response;
  return res;
};

const makeNext = () => jest.fn();

describe("ImageController", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("upload", () => {
    it("should queue image upload and respond pending", async () => {
      const queuedPayload = {
        status: "queued",
        message: "Image upload enqueued, processing asynchronously",
      };

      jest
        .spyOn(ImageService, "uploadImage")
        .mockResolvedValue(queuedPayload as any);

      const req = {
        file: { buffer: Buffer.from("test"), originalname: "test.jpg" },
        params: {},
        query: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = { user: { id: 42 } };

      const next = makeNext();

      await ImageController.upload(req, res, next);

      expect(ImageService.uploadImage).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: Buffer.from("test"),
          originalname: "test.jpg",
        }),
        42,
      );
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatusText.SUCCESS,
        data: queuedPayload,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with 400 when no file is uploaded", async () => {
      const req = {
        file: undefined,
        params: {},
        query: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = { user: { id: 42 } };

      const next = makeNext();

      await ImageController.upload(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(400);
    });

    it("should call next with 401 when no userId", async () => {
      const req = {
        file: { buffer: Buffer.from("test"), originalname: "test.jpg" },
        params: {},
        query: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = { user: undefined };

      const next = makeNext();

      await ImageController.upload(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(401);
    });

    it("should call next when uploadImage throws", async () => {
      jest
        .spyOn(ImageService, "uploadImage")
        .mockRejectedValue(
          Object.assign(new Error("Cloudinary error"), { statusCode: 500 }),
        );

      const req = {
        file: { buffer: Buffer.from("test"), originalname: "test.jpg" },
        params: {},
        query: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = { user: { id: 42 } };

      const next = makeNext();

      await ImageController.upload(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(500);
    });
  });

  describe("get", () => {
    it("should return image url for a valid publicId", async () => {
      const fakeUrl = "https://cdn/abc123.jpg";
      jest.spyOn(ImageService, "getImage").mockResolvedValue(fakeUrl as any);

      const req = {
        params: {},
        query: { publicId: "abc123" },
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = {};

      const next = makeNext();

      await ImageController.get(req, res, next);

      expect(ImageService.getImage).toHaveBeenCalledWith("abc123");
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatusText.SUCCESS,
        data: { url: fakeUrl },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with 400 when publicId is missing", async () => {
      const req = {
        params: {},
        query: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = {};

      const next = makeNext();

      await ImageController.get(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(400);
    });

    it("should call next when getImage throws", async () => {
      jest
        .spyOn(ImageService, "getImage")
        .mockRejectedValue(
          Object.assign(new Error("Not found"), { statusCode: 404 }),
        );

      const req = {
        params: { publicId: "nonexistent" },
        query: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = {};

      const next = makeNext();

      await ImageController.get(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(404);
    });
  });

  describe("transform", () => {
    it("should return transformed image url", async () => {
      const fakeUrl = "https://cdn/abc123_transformed.jpg";
      jest.spyOn(ImageService, "transform").mockResolvedValue({
        imageId: "abc123",
        publicId: "encoded-public-id",
        status: "completed",
        url: fakeUrl,
      });

      const transformations = {
        resize: { width: 800, height: 600 },
        rotate: 90,
      };

      const req = {
        query: { id: "abc123" },
        params: {},
        body: { transformations },
      } as unknown as Request;

      const res = makeResponse();
      res.locals = {};

      const next = makeNext();

      await ImageController.transform(req, res, next);

      expect(ImageService.transform).toHaveBeenCalledWith(
        transformations,
        "abc123",
      );
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatusText.SUCCESS,
        data: { imageId: "abc123", url: fakeUrl },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with 400 when image id is missing", async () => {
      const req = {
        query: {},
        params: {},
        body: { transformations: {} },
      } as unknown as Request;

      const res = makeResponse();
      res.locals = {};

      const next = makeNext();

      await ImageController.transform(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(400);
    });

    it("should call next when transform throws", async () => {
      jest
        .spyOn(ImageService, "transform")
        .mockRejectedValue(
          Object.assign(new Error("Transform failed"), { statusCode: 500 }),
        );

      const req = {
        query: { id: "abc123" },
        params: {},
        body: { transformations: { rotate: 45 } },
      } as unknown as Request;

      const res = makeResponse();
      res.locals = {};

      const next = makeNext();

      await ImageController.transform(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(500);
    });
  });

  describe("getUploadStatus", () => {
    it("should return upload status", async () => {
      const status = {
        id: "uuid-1",
        status: "pending",
        publicId: null,
        url: null,
      };
      jest
        .spyOn(ImageService, "getUploadStatus")
        .mockResolvedValue(status as any);

      const req = {
        params: { id: "uuid-1" },
        query: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = {};

      const next = makeNext();

      await ImageController.getUploadStatus(req, res, next);

      expect(ImageService.getUploadStatus).toHaveBeenCalledWith("uuid-1");
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatusText.SUCCESS,
        data: status,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("getImages", () => {
    it("should return paginated images", async () => {
      const images = [{ id: "abc", url: "https://cdn/test.jpg", userId: 42 }];
      jest.spyOn(ImageService, "getImages").mockResolvedValue(images as any);

      const req = {
        query: { page: "1", limit: "10" },
        params: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = { user: { id: 42 } };

      const next = makeNext();

      await ImageController.getImages(req, res, next);

      expect(ImageService.getImages).toHaveBeenCalledWith(42, 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatusText.SUCCESS,
        page: 1,
        limit: 10,
        count: images.length,
        data: images,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should use default page=1 and limit=10 when query params are missing", async () => {
      const images: any[] = [];
      jest.spyOn(ImageService, "getImages").mockResolvedValue(images);

      const req = {
        query: {},
        params: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = { user: { id: 42 } };

      const next = makeNext();

      await ImageController.getImages(req, res, next);

      expect(ImageService.getImages).toHaveBeenCalledWith(42, 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next with 400 when pagination params are invalid", async () => {
      const req = {
        query: { page: "-1", limit: "10" },
        params: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = { user: { id: 42 } };

      const next = makeNext();

      await ImageController.getImages(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(400);
    });

    it("should call next with 401 when no userId", async () => {
      const req = {
        query: { page: "1", limit: "10" },
        params: {},
        body: {},
      } as unknown as Request;

      const res = makeResponse();
      res.locals = { user: undefined };

      const next = makeNext();

      await ImageController.getImages(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(401);
    });
  });
});
