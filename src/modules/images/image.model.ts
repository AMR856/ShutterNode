import prisma from "../../config/prisma";

export class ImageModel {
  static findByUserIdPaginated(userId: number, skip: number, limit: number) {
    return prisma.image.findMany({
      where: {
        userId,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static findById(id: string) {
    return prisma.image.findUnique({
      where: { id },
    });
  }

  static findByPublicId(publicId: string) {
    return prisma.image.findUnique({
      where: { publicId },
    });
  }

  static createPending(userId: number) {
    return prisma.image.create({
      data: {
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  static updateStatus(
    id: string,
    data: { publicId?: string; url?: string; status: string },
  ) {

    return prisma.image.update({
      where: { id },
      data: {
        ...(data.publicId !== undefined && { publicId: data.publicId }),
        ...(data.url !== undefined && { url: data.url }),
        status: data.status,
      },
    });
  }

  static create(data: { publicId: string; url: string; userId: number }) {
    return prisma.image.create({
      data: {
        publicId: data.publicId,
        url: data.url,
        status: "completed",
        user: {
          connect: { id: data.userId },
        },
      },
    });
  }
}
