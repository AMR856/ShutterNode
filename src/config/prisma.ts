import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Singleton pattern to ensure only one instance of PrismaClient is used throughout the application
export default prisma;
