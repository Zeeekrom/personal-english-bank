import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { ReviewSubmission } from "@peb/domain";
import { ReviewsService } from "./reviews.service.js";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("due")
  due() {
    return this.reviewsService.due();
  }

  @Post(":learningItemId")
  submit(
    @Param("learningItemId") learningItemId: string,
    @Body() body: ReviewSubmission,
  ) {
    return this.reviewsService.submit(learningItemId, body);
  }
}
