import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/response/api-exception.filter";

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
  app.useGlobalFilters(new ApiExceptionFilter());
  const port = Number(process.env.CRON_PORT ?? 3001);
  await app.listen(port);
  new Logger("Bootstrap").log(`cron-service listening on http://localhost:${port}/cron`);
}

void bootstrap();
