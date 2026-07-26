import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PATCH"],
  });
  app.setGlobalPrefix("api");
  await app.listen(Number(process.env.API_PORT ?? 3001));
}

void bootstrap();
