import prisma from "../../config/prisma";

export class UserModel {
  static findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }

  static create(data: { email: string; password: string }) {
    return prisma.user.create({ data });
  }
}
