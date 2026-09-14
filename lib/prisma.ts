import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Next.js dev mode hot-reloads modules on every file change, which would
// otherwise construct a new PrismaClient (and a new connection pool) each
// time and eventually exhaust the database's connection limit. Cache the
// instance on `globalThis` so HMR reuses it across reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const connectionString = `${process.env.DATABASE_URL}`;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
