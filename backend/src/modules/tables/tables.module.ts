import { Injectable, NotFoundException, BadRequestException, Module } from '@nestjs/common';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAllByBranch(branchId: string, status?: string) {
    let activeBranchId = branchId;
    if (activeBranchId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: activeBranchId } });
      if (!branch) activeBranchId = '';
    }
    if (!activeBranchId) {
      const defaultBranch = await this.prisma.branch.findFirst({ where: { status: 'ACTIVE' } });
      if (defaultBranch) activeBranchId = defaultBranch.id;
    }

    const where: any = { branchId: activeBranchId };
    if (status) where.status = status;

    const data = await this.prisma.table.findMany({
      where,
      orderBy: { number: 'asc' },
    });

    return { data };
  }

  async create(branchId: string, data: { number: number; capacity?: number }) {
    let activeBranchId = branchId;
    if (activeBranchId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: activeBranchId } });
      if (!branch) activeBranchId = '';
    }
    if (!activeBranchId) {
      const defaultBranch = await this.prisma.branch.findFirst({ where: { status: 'ACTIVE' } });
      if (defaultBranch) activeBranchId = defaultBranch.id;
      else throw new BadRequestException('No active branch available');
    }

    const existing = await this.prisma.table.findFirst({
      where: { branchId: activeBranchId, number: Number(data.number) },
    });
    if (existing) {
      throw new BadRequestException(`Table number ${data.number} already exists in this branch`);
    }

    const table = await this.prisma.table.create({
      data: {
        branchId: activeBranchId,
        number: Number(data.number),
        capacity: data.capacity ? Number(data.capacity) : 4,
        status: 'AVAILABLE',
      },
    });

    return table;
  }

  async update(id: string, data: any) {
    return this.prisma.table.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.table.delete({ where: { id } });
  }
}

@ApiTags('Tables & Floor Plan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @ApiOperation({ summary: 'Get branch dining tables' })
  @Get('branches/:branchId/tables')
  async findAll(@Param('branchId') branchId: string, @Query('status') status?: string) {
    return this.tablesService.findAllByBranch(branchId, status);
  }

  @ApiOperation({ summary: 'Get default branch dining tables' })
  @Get('tables')
  async findAllDefault(@Query('status') status?: string) {
    return this.tablesService.findAllByBranch('', status);
  }

  @ApiOperation({ summary: 'Create dining table' })
  @Post('branches/:branchId/tables')
  async create(@Param('branchId') branchId: string, @Body() body: any) {
    const data = await this.tablesService.create(branchId, body);
    return { data };
  }

  @ApiOperation({ summary: 'Create dining table in default branch' })
  @Post('tables')
  async createDefault(@Body() body: any) {
    const data = await this.tablesService.create('', body);
    return { data };
  }

  @ApiOperation({ summary: 'Update table status or capacity' })
  @Patch('tables/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.tablesService.update(id, body);
    return { data };
  }

  @ApiOperation({ summary: 'Delete table' })
  @Delete('tables/:id')
  async remove(@Param('id') id: string) {
    const data = await this.tablesService.remove(id);
    return { data };
  }
}

@Module({
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
