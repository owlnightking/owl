import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/response/api-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
  console.log(`api-service listening on http://localhost:${port}/api`);
}

void bootstrap();
