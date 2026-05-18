import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { MemberLevelService } from './member-level.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

interface JwtUser {
  staffId: string;
  shopId: string;
  role: string;
}

@Controller('api/v1/member-levels')
export class MemberLevelController {
  constructor(private memberLevelService: MemberLevelService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtUser) {
    return this.memberLevelService.findAll(user.shopId);
  }

  @Post()
  async create(
    @CurrentUser() user: JwtUser,
    @Body() body: { name: string; discount: number; sortOrder?: number; remark?: string },
  ) {
    return this.memberLevelService.create(user.shopId, body);
  }

  @Patch('reorder')
  async reorder(
    @CurrentUser() user: JwtUser,
    @Body() body: { ids: string[] },
  ) {
    await this.memberLevelService.reorder(body.ids, user.shopId);
    return { success: true };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() body: { name?: string; discount?: number; sortOrder?: number; remark?: string },
  ) {
    return this.memberLevelService.update(id, user.shopId, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.memberLevelService.remove(id, user.shopId);
  }
}
