import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { resolve } from "node:path";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(__dirname, "../../../.env"), ".env"],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthController],
})
export class AppModule {}
