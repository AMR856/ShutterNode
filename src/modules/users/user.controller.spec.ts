import { Request, Response } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import CustomError from "../../types/customError";

interface HttpError {
  statusCode: number;
  message?: string;
}

const makeResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    locals: {},
  } as unknown as Response;
  return res;
};

const makeNext = () => jest.fn();

describe("UserController", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("register", () => {
    it("should return 201 with user data on success", async () => {
      const fakeUser = { id: 1, email: "test@example.com" };
      jest.spyOn(UserService, "register").mockResolvedValue(fakeUser as any);

      const req = { params: {}, query: {}, body: {} } as Request;
      const res = makeResponse();
      res.locals = { body: { email: "test@example.com", password: "password123" } };

      const next = makeNext();

      await UserController.register(req, res, next);

      expect(UserService.register).toHaveBeenCalledWith(res.locals.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatusText.SUCCESS,
        data: fakeUser,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error when user already exists", async () => {
      const conflict = new CustomError("User already exists", 409, HttpStatusText.FAIL);
      jest.spyOn(UserService, "register").mockRejectedValue(conflict);

      const req = { params: {}, query: {}, body: {} } as Request;
      const res = makeResponse();
      res.locals = { body: { email: "taken@example.com", password: "password123" } };

      const next = makeNext();

      await UserController.register(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(409);
    });
  });


  describe("login", () => {
    it("should set cookie and return token on success", async () => {
      const fakeResult = { token: "jwt.token.here" };
      jest.spyOn(UserService, "login").mockResolvedValue(fakeResult as any);

      const req = { params: {}, query: {}, body: {} } as Request;
      const res = makeResponse();
      res.locals = { body: { email: "test@example.com", password: "password123" } };

      const next = makeNext();

      await UserController.login(req, res, next);

      expect(UserService.login).toHaveBeenCalledWith(res.locals.body);
      expect(res.cookie).toHaveBeenCalledWith(
        "token",
        fakeResult.token,
        expect.objectContaining({ httpOnly: true })
      );
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatusText.SUCCESS,
        data: fakeResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with 401 on invalid credentials", async () => {
      const unauthorized = new CustomError("Invalid credentials", 401, HttpStatusText.FAIL);
      jest.spyOn(UserService, "login").mockRejectedValue(unauthorized);

      const req = { params: {}, query: {}, body: {} } as Request;
      const res = makeResponse();
      res.locals = { body: { email: "test@example.com", password: "wrong" } };

      const next = makeNext();

      await UserController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(401);
    });
  });


  describe("profile", () => {
    it("should return user profile data", async () => {
      const fakeUser = { id: 42, email: "test@example.com", username: "tester" };
      jest.spyOn(UserService, "profile").mockResolvedValue(fakeUser as any);

      const req = { params: {}, query: {}, body: {} } as Request;
      const res = makeResponse();
      res.locals = { user: { id: fakeUser.id } };

      const next = makeNext();

      await UserController.profile(req, res, next);

      expect(UserService.profile).toHaveBeenCalledWith(42);
      expect(res.json).toHaveBeenCalledWith({
        status: HttpStatusText.SUCCESS,
        data: fakeUser,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with 401 when no userId", async () => {
      const req = { params: {}, query: {}, body: {} } as Request;
      const res = makeResponse();
      res.locals = { user: undefined };

      const next = makeNext();

      await UserController.profile(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
    });

    it("should call next with 404 when user not found", async () => {
      const notFound = new CustomError("User not found", 404, HttpStatusText.FAIL);
      jest.spyOn(UserService, "profile").mockRejectedValue(notFound);

      const req = { params: {}, query: {}, body: {} } as Request;
      const res = makeResponse();
      res.locals = { user: { id: 99 } };

      const next = makeNext();

      await UserController.profile(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock).mock.calls[0]?.[0] as HttpError;
      expect(err.statusCode).toBe(404);
    });
  });
});