import path from "node:path";
import { PrismaMssql } from "@prisma/adapter-mssql";
import dotenv from "dotenv";
import { PrismaClient } from "./generated/client.js";

dotenv.config({
  path: [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env")
  ],
  quiet: true
});

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const adapter = new PrismaMssql({
  server: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 1433),
  database: process.env.DATABASE_NAME ?? "personal_english_bank",
  user: process.env.DATABASE_USER ?? "sa",
  password: required("DATABASE_PASSWORD"),
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
});

export const prisma = new PrismaClient({ adapter });
export * from "./generated/client.js";
