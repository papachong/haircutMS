import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CurrentShop } from '../../../common/decorators/current-shop.decorator';
import {
  CreateTagGroupDto,
  CreateTagDto,
  SetMemberTagsDto,
  AddMemberTagDto,
  RemoveMemberTagDto,
  UpdateTagGroupDto,
  UpdateTagDto,
} from './dto/tag.dto';

@Controller('api/v1')
export class TagController {
  constructor(private tagService: TagService) {}

  // --- Tag Groups ---

  @Get('tag-groups')
  async findAllGroups(@CurrentShop() shopId: string) {
    return this.tagService.findAllGroups(shopId);
  }

  @Get('tag-groups/:id')
  async findGroupById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.findGroupById(id, shopId);
  }

  @Post('tag-groups')
  async createGroup(
    @CurrentShop() shopId: string,
    @Body() dto: CreateTagGroupDto,
  ) {
    return this.tagService.createGroup(shopId, dto);
  }

  @Patch('tag-groups/:id')
  async updateGroup(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() dto: UpdateTagGroupDto,
  ) {
    return this.tagService.updateGroup(id, shopId, dto);
  }

  @Delete('tag-groups/:id')
  async deleteGroup(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.deleteGroup(id, shopId);
  }

  // --- Tags ---

  @Get('tags/:id')
  async findTagById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.findTagById(id, shopId);
  }

  @Post('tag-groups/:groupId/tags')
  async createTag(
    @Param('groupId') groupId: string,
    @CurrentShop() shopId: string,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagService.createTag(groupId, shopId, dto);
  }

  @Patch('tags/:id')
  async updateTag(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagService.updateTag(id, shopId, dto);
  }

  @Delete('tags/:id')
  async deleteTag(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.deleteTag(id, shopId);
  }

  // --- Member Tags ---

  @Get('members/:memberId/tags')
  async getMemberTags(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.getMemberTags(memberId, shopId);
  }

  @Get('members/:memberId/tags/auto')
  async getSystemAutoTags(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
  ) {
    return this.tagService.getSystemAutoTags(memberId, shopId);
  }

  @Post('members/:memberId/tags')
  async setMemberTags(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
    @Body() dto: SetMemberTagsDto,
  ) {
    return this.tagService.setMemberTags(memberId, shopId, dto.tagIds);
  }

  @Post('members/:memberId/tags/add')
  async addMemberTag(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
    @Body() dto: AddMemberTagDto,
  ) {
    return this.tagService.addMemberTag(memberId, shopId, dto.tagId);
  }

  @Post('members/:memberId/tags/remove')
  async removeMemberTag(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
    @Body() dto: RemoveMemberTagDto,
  ) {
    return this.tagService.removeMemberTag(memberId, shopId, dto.tagId);
  }
}