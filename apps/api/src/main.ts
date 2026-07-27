import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.useBodyParser("json", { limit: "10mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "10mb" });
  app.enableCors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });
  app.setGlobalPrefix("api");
  await app.listen(Number(process.env.API_PORT ?? 3001));
}

void bootstrap();
