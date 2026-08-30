import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users & Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private checkAdmin(user: any) {
    if (!user.roles?.includes('OWNER') && !user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Only restaurant owners or administrators can perform this action');
    }
  }

  @ApiOperation({ summary: 'List all staff members for the restaurant' })
  @Get()
  async findAll(@CurrentUser() user: any) {
    this.checkAdmin(user);
    const data = await this.usersService.findAll(user.restaurantId);
    return { data };
  }

  @ApiOperation({ summary: 'Get details of a specific staff member' })
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    this.checkAdmin(user);
    const data = await this.usersService.findOne(id, user.restaurantId);
    return { data };
  }

  @ApiOperation({ summary: 'Create a new staff member' })
  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    this.checkAdmin(user);
    const data = await this.usersService.create(dto, user.restaurantId);
    return { data };
  }

  @ApiOperation({ summary: 'Update an existing staff member' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    this.checkAdmin(user);
    const data = await this.usersService.update(id, dto, user.restaurantId);
    return { data };
  }

  @ApiOperation({ summary: 'Delete a staff member' })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    this.checkAdmin(user);
    const data = await this.usersService.remove(id, user.restaurantId, user.userId);
    return { data };
  }
}
