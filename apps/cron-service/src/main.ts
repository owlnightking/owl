import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("cron");
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
      .setTitle("cron-service")
      .setDescription(
        "Owl cron-service 接口文档。所有接口统一返回 `{ code, data, message }`：成功 `code=200`，分页 `data={ list, pageNum, pageSize, total }`，失败 `data=null` + 错误 `message`。"
      )
      .setVersion("1.0")
      .build();
    SwaggerModule.setup("cron/docs", app, SwaggerModule.createDocument(app, config));
  }

  const port = Number(process.env.CRON_PORT ?? 3001);
  await app.listen(port);
  const logger = new Logger("Bootstrap");
  logger.log(`cron-service listening on http://localhost:${port}/cron`);
  if (!isProduction) {
    logger.log(`cron-service Swagger UI: http://localhost:${port}/cron/docs`);
  }
}

void bootstrap();
