import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set("trust proxy", true);
  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle("api-service")
      .setDescription(
        "Owl api-service 接口文档。所有接口统一返回 `{ code, data, message }`：成功 `code=200`，分页 `data={ list, pageNum, pageSize, total }`，失败 `data=null` + 错误 `message`。"
      )
      .setVersion("1.0")
      .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "bearer")
      .addSecurityRequirements("bearer")
      .build();
    SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));
  }

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
  const logger = new Logger("Bootstrap");
  logger.log(`api-service listening on http://localhost:${port}/api`);
  if (!isProduction) {
    logger.log(`api-service Swagger UI: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
