import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Restaurants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

  @ApiOperation({ summary: 'Get user accessible restaurants' })
  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.restaurantsService.findAll(userId, Number(page) || 1, Number(limit) || 20);
  }

  @ApiOperation({ summary: 'Get restaurant details' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.restaurantsService.findOne(id);
    return { data };
  }

  @ApiOperation({ summary: 'Create a new restaurant' })
  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() body: { name: string; description?: string; email?: string; phone?: string },
  ) {
    const data = await this.restaurantsService.create(userId, body);
    return { data };
  }

  @ApiOperation({ summary: 'Update restaurant details' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.restaurantsService.update(id, body);
    return { data };
  }

  @ApiOperation({ summary: 'Soft delete restaurant' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.restaurantsService.remove(id);
    return { data };
  }
}
