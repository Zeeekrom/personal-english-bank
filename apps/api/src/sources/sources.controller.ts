import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { SourcesService } from "./sources.service.js";

@Controller("sources")
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  list(@Query("q") query?: string) {
    return this.sourcesService.list(query?.trim() || undefined);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.sourcesService.get(id);
  }

  @Patch("segments/:segmentId/speaker")
  assignSpeaker(
    @Param("segmentId") segmentId: string,
    @Body()
    body: {
      displayName: string;
      role?: string;
      isMe?: boolean;
      applyToDiarizationKey?: boolean;
    }
  ) {
    return this.sourcesService.assignSpeaker(segmentId, body);
  }

  @Post(":id/interactions")
  createInteraction(
    @Param("id") id: string,
    @Body()
    body: {
      eventTitle?: string;
      scenario?: string;
      whatHappened?: string;
      whatTheySaid?: string;
      whatISaid?: string;
      whatIIntended?: string;
      whatWentWrong?: string;
      betterVersion?: string;
      followUp?: string;
      reflection?: string;
    }
  ) {
    return this.sourcesService.createInteraction(id, body);
  }
}
