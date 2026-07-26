import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import type {
  CreateLearningItemInput,
  UpdateLearningItemInput,
  UsageEventInput,
} from "@peb/domain";
import { LearningItemsService } from "./learning-items.service.js";

@Controller("learning-items")
export class LearningItemsController {
  constructor(private readonly learningItemsService: LearningItemsService) {}

  @Get()
  list(@Query("q") query?: string) {
    return this.learningItemsService.list(query?.trim() || undefined);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.learningItemsService.get(id);
  }

  @Post()
  create(@Body() body: CreateLearningItemInput) {
    return this.learningItemsService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateLearningItemInput) {
    return this.learningItemsService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.learningItemsService.remove(id);
  }

  @Post(":id/usage")
  recordUsage(@Param("id") id: string, @Body() body: UsageEventInput) {
    return this.learningItemsService.recordUsage(id, body);
  }
}
