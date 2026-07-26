import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller.js";
import { ExportController } from "./export.controller.js";
import { ImportController } from "./import/import.controller.js";
import { ImportService } from "./import/import.service.js";
import { LearningItemsController } from "./learning/learning-items.controller.js";
import { LearningItemsService } from "./learning/learning-items.service.js";
import { ReviewsController } from "./review/reviews.controller.js";
import { ReviewsService } from "./review/reviews.service.js";
import { SourcesController } from "./sources/sources.controller.js";
import { SourcesService } from "./sources/sources.service.js";

@Module({
  controllers: [
    DashboardController,
    ExportController,
    ImportController,
    SourcesController,
    LearningItemsController,
    ReviewsController
  ],
  providers: [ImportService, SourcesService, LearningItemsService, ReviewsService]
})
export class AppModule {}
