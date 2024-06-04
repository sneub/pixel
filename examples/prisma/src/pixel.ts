import { Pixel, PrismaAdapter } from '@pixel/nextjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default new Pixel(new PrismaAdapter(prisma));
