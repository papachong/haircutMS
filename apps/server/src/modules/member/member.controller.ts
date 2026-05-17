import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { MemberService } from './member.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CreateMemberDto, UpdateMemberDto, QueryMemberDto } from './dto/member.dto';

@Controller('api/v1/members')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Get()
  async findAll(
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberDto,
  ) {
    return this.memberService.findAll(shopId, query);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.memberService.findById(id, shopId);
  }

  @Post()
  async create(
    @CurrentShop() shopId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.memberService.create(shopId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.memberService.update(id, shopId, dto);
  }
}
