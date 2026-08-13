import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  const port = Number(process.env.CRON_PORT ?? 3001);
  await app.listen(port);
  console.log(`cron-service listening on http://localhost:${port}/api`);
}

void bootstrap();
