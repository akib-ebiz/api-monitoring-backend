import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiService } from './api.service';
import { Api } from './api.schema';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post()
  async create(@Body() createApiDto: { url: string; name: string; interval?: number }): Promise<Api> {
    return this.apiService.create(createApiDto);
  }

  @Get()
  async findAll(): Promise<Api[]> {
    return this.apiService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Api> {
    return this.apiService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Api> {
    return this.apiService.remove(id);
  }
}
