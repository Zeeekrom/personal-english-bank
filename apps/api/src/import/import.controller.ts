import { Body, Controller, Get, Post } from "@nestjs/common";
import { ImportService } from "./import.service.js";

@Controller("imports")
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get("discover")
  discover() {
    return this.importService.discover();
  }

  @Post()
  importFiles(@Body() body: { relativePaths?: string[] }) {
    return this.importService.importRelativePaths(body.relativePaths ?? []);
  }
}
