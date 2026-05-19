import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CurrentShop } from '../../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import {
  CreateTagGroupDto,
  CreateTagDto,
  SetMemberTagsDto,
  AddMemberTagDto,
  RemoveMemberTagDto,
  UpdateTagGroupDto,
  UpdateTagDto,
} from './dto/tag.dto';

@ApiTags('会员标签')
@ApiBearerAuth()
@Controller('api/v1')
export class TagController {
  constructor(private tagService: TagService) {}

  // --- Tag Groups ---

  @Get('tag-groups')
  @ApiOperation({ summary: '获取所有标签组' })
  @ApiResponse({ status: 200, description: '成功获取标签组列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAllGroups(@CurrentShop() shopId: string) {
    return this.tagService.findAllGroups(shopId);
  }

  @Get('tag-groups/:id')
  @ApiOperation({ summary: '获取标签组详情' })
  @ApiResponse({ status: 200, description: '成功获取标签组详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '标签组不存在' })
  async findGroupById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.findGroupById(id, shopId);
  }

  @Post('tag-groups')
  @ApiOperation({ summary: '创建标签组' })
  @ApiResponse({ status: 201, description: '标签组创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createGroup(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateTagGroupDto,
  ) {
    return this.tagService.createGroup(shopId, dto, operatorId, req.ip);
  }

  @Patch('tag-groups/:id')
  @ApiOperation({ summary: '更新标签组' })
  @ApiResponse({ status: 200, description: '标签组更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '标签组不存在' })
  async updateGroup(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: UpdateTagGroupDto,
  ) {
    return this.tagService.updateGroup(id, shopId, dto, operatorId, req.ip);
  }

  @Delete('tag-groups/:id')
  @ApiOperation({ summary: '删除标签组' })
  @ApiResponse({ status: 200, description: '标签组删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '标签组不存在' })
  async deleteGroup(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
  ) {
    return this.tagService.deleteGroup(id, shopId, operatorId, req.ip);
  }

  // --- Tags ---

  @Get('tags/:id')
  @ApiOperation({ summary: '获取标签详情' })
  @ApiResponse({ status: 200, description: '成功获取标签详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  async findTagById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.findTagById(id, shopId);
  }

  @Post('tag-groups/:groupId/tags')
  @ApiOperation({ summary: '在标签组下创建标签' })
  @ApiResponse({ status: 201, description: '标签创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createTag(
    @Param('groupId') groupId: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagService.createTag(groupId, shopId, dto, operatorId, req.ip);
  }

  @Patch('tags/:id')
  @ApiOperation({ summary: '更新标签' })
  @ApiResponse({ status: 200, description: '标签更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  async updateTag(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagService.updateTag(id, shopId, dto, operatorId, req.ip);
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: '删除标签' })
  @ApiResponse({ status: 200, description: '标签删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  async deleteTag(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
  ) {
    return this.tagService.deleteTag(id, shopId, operatorId, req.ip);
  }

  // --- Member Tags ---

  @Get('members/:memberId/tags')
  @ApiOperation({ summary: '获取会员的标签列表' })
  @ApiResponse({ status: 200, description: '成功获取会员标签' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getMemberTags(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.getMemberTags(memberId, shopId);
  }

  @Get('members/:memberId/tags/auto')
  @ApiOperation({ summary: '获取会员的自动标签（系统计算）' })
  @ApiResponse({ status: 200, description: '成功获取自动标签' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getSystemAutoTags(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.getSystemAutoTags(memberId, shopId);
  }

  @Post('members/:memberId/tags')
  @ApiOperation({ summary: '设置会员标签（覆盖已有标签）' })
  @ApiResponse({ status: 200, description: '标签设置成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async setMemberTags(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
    @Body() dto: SetMemberTagsDto,
  ) {
    return this.tagService.setMemberTags(memberId, shopId, dto.tagIds);
  }

  @Post('members/:memberId/tags/add')
  @ApiOperation({ summary: '为会员添加单个标签' })
  @ApiResponse({ status: 200, description: '标签添加成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async addMemberTag(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: AddMemberTagDto,
  ) {
    return this.tagService.addMemberTag(memberId, shopId, dto.tagId, operatorId, req.ip);
  }

  @Post('members/:memberId/tags/remove')
  @ApiOperation({ summary: '移除会员的单个标签' })
  @ApiResponse({ status: 200, description: '标签移除成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async removeMemberTag(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: RemoveMemberTagDto,
  ) {
    return this.tagService.removeMemberTag(memberId, shopId, dto.tagId, operatorId, req.ip);
  }
}
