import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { CreateLearningItemInput, UsageEventInput } from "@peb/domain";
import { LearningItemsService } from "./learning-items.service.js";

@Controller("learning-items")
export class LearningItemsController {
  constructor(private readonly learningItemsService: LearningItemsService) {}

  @Get()
  list() {
    return this.learningItemsService.list();
  }

  @Post()
  create(@Body() body: CreateLearningItemInput) {
    return this.learningItemsService.create(body);
  }

  @Post(":id/usage")
  recordUsage(@Param("id") id: string, @Body() body: UsageEventInput) {
    return this.learningItemsService.recordUsage(id, body);
  }
}
