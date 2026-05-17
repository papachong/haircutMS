import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RechargeMemberDto, PayMethod } from './dto/recharge.dto';
import { RechargeResult, RechargeHistoryResult } from './types/recharge.types';
import { AuditService, AuditActions } from '../../modules/audit/audit.service';
import { RechargePlanService } from '../../modules/recharge/recharge-plan.service';

@Injectable()
export class RechargeOperationService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private rechargePlanService: RechargePlanService,
  ) {}

  async recharge(
    memberId: string,
    shopId: string,
    operatorId: string,
    ip: string,
    dto: RechargeMemberDto,
  ): Promise<RechargeResult> {
    if (!dto.planId && !dto.amount) {
      throw new BadRequestException('必须指定充值方案或充值金额');
    }

    let amount: number;
    let giftAmount: number;
    let planId = dto.planId ? String(dto.planId) : undefined;
    let planName: string | undefined;

    if (dto.planId) {
      const plan = await this.prisma.rechargePlan.findFirst({
        where: { id: planId, shopId, isActive: true },
      });

      if (!plan) {
        throw new NotFoundException('充值方案不存在或已失效');
      }

      if (dto.amount && dto.amount !== plan.amount) {
        throw new BadRequestException('充值金额与方案金额不一致');
      }

      amount = plan.amount;
      giftAmount = plan.giftAmount;
      planName = plan.name;
    } else {
      amount = dto.amount!;
      giftAmount = dto.giftAmount ?? 0;
    }

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId, isActive: true },
    });

    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    const rechargeRecord = await this.prisma.$transaction(async (tx) => {
      const record = await tx.rechargeRecord.create({
        data: {
          memberId,
          operatorId,
          planId,
          amount,
          giftAmount,
          payMethod: dto.payMethod,
          remark: dto.remark,
        },
      });

      await tx.member.update({
        where: { id: memberId },
        data: {
          principalBalance: { increment: amount },
          giftBalance: { increment: giftAmount },
          totalRecharge: { increment: amount },
        },
      });

      return record;
    });

    const updatedMember = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        cardNo: true,
        name: true,
        principalBalance: true,
        giftBalance: true,
      },
    });

    await this.auditService.log({
      shopId,
      staffId: operatorId,
      action: AuditActions.RECHARGE,
      targetType: 'Member',
      targetId: memberId,
      detail: {
        memberId,
        cardNo: member.cardNo,
        memberName: member.name,
        amount,
        giftAmount,
        payMethod: dto.payMethod,
        planId: planId && planName ? planId : undefined,
        planName,
        remark: dto.remark,
      },
      ip,
    });

    return {
      member: updatedMember!,
      rechargeRecord: {
        id: rechargeRecord.id,
        amount: rechargeRecord.amount,
        giftAmount: rechargeRecord.giftAmount,
        payMethod: rechargeRecord.payMethod,
        createdAt: rechargeRecord.createdAt,
      },
    };
  }

  async getRechargeHistory(
    memberId: string,
    shopId: string,
    query: { page?: number; pageSize?: number },
  ): Promise<RechargeHistoryResult> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.rechargeRecord.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          operator: {
            select: { id: true, name: true },
          },
          plan: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.rechargeRecord.count({ where: { memberId } }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      },
    };
  }
}