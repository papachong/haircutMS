import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as XLSX from 'xlsx';

export type ExportFormat = 'xlsx' | 'csv';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export members for a shop
   */
  async exportMembers(shopId: string, format: ExportFormat): Promise<Buffer> {
    const members = await this.prisma.member.findMany({
      where: { shopId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        memberLevel: { select: { name: true } },
      },
    });

    const genderMap: Record<string, string> = {
      MALE: '男',
      FEMALE: '女',
      OTHER: '其他',
    };

    const rows = members.map((m) => ({
      '会员卡号': m.cardNo,
      '姓名': m.name,
      '手机号': m.phone,
      '性别': genderMap[m.gender as string] || '',
      '生日': m.birthday ? new Date(m.birthday).toISOString().split('T')[0] : '',
      '会员等级': m.memberLevel?.name || '',
      '本金余额(分)': m.principalBalance,
      '赠送余额(分)': m.giftBalance,
      '总消费(分)': m.totalConsume,
      '到店次数': m.visitCount,
      '最后到店': m.lastVisitAt ? new Date(m.lastVisitAt).toLocaleDateString('zh-CN') : '',
      '注册时间': new Date(m.createdAt).toLocaleString('zh-CN'),
    }));

    return this.generateFile(rows, format, '会员列表');
  }

  /**
   * Export orders for a shop with date range filtering
   */
  async exportOrders(
    shopId: string,
    format: ExportFormat,
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    const where: Record<string, unknown> = { shopId };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.createdAt = dateFilter;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: {
            name: true,
            cardNo: true,
            phone: true,
            memberLevel: { select: { name: true } },
          },
        },
        items: {
          include: {
            serviceItem: { select: { name: true } },
            staff: { select: { name: true } },
          },
        },
        payments: {
          select: { method: true, amount: true },
        },
      },
    });

    const statusMap: Record<string, string> = {
      PENDING: '待结算',
      SETTLED: '已结算',
      CANCELLED: '已取消',
      REFUNDED: '已退款',
    };

    const paymentMethodMap: Record<string, string> = {
      BALANCE: '余额支付',
      PASS_CARD: '次卡支付',
      OFFLINE: '线下支付',
      COUPON: '优惠券',
    };

    const rows = orders.map((order) => ({
      '订单号': order.orderNo,
      '会员姓名': order.member.name,
      '会员卡号': order.member.cardNo,
      '手机号': order.member.phone,
      '会员等级': order.member.memberLevel?.name || '',
      '订单状态': statusMap[order.status] || order.status,
      '原价(分)': order.originalAmount,
      '优惠(分)': order.discountAmount,
      '应付(分)': order.payableAmount,
      '实付(分)': order.paidAmount,
      '服务项目': order.items
        .map((item) => `${item.serviceName}(${item.staffName})x${item.quantity}`)
        .join('; '),
      '支付方式': order.payments
        .map((p) => `${paymentMethodMap[p.method] || p.method}:${p.amount}`)
        .join(', '),
      '备注': order.remark || '',
      '创建时间': new Date(order.createdAt).toLocaleString('zh-CN'),
      '结算时间': order.settledAt ? new Date(order.settledAt).toLocaleString('zh-CN') : '',
      '取消时间': order.cancelledAt ? new Date(order.cancelledAt).toLocaleString('zh-CN') : '',
    }));

    return this.generateFile(rows, format, '订单数据');
  }

  /**
   * Export recharge records for a shop
   */
  async exportRechargeRecords(shopId: string, format: ExportFormat): Promise<Buffer> {
    const records = await this.prisma.rechargeRecord.findMany({
      where: {
        member: { shopId },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: { name: true, cardNo: true, phone: true },
        },
        operator: {
          select: { name: true },
        },
        plan: {
          select: { name: true },
        },
      },
    });

    const rows = records.map((r) => ({
      '会员姓名': r.member.name,
      '会员卡号': r.member.cardNo,
      '手机号': r.member.phone,
      '充值金额(分)': r.amount,
      '赠送金额(分)': r.giftAmount,
      '支付方式': r.payMethod,
      '充值方案': r.plan?.name || '直接充值',
      '操作人': r.operator.name,
      '备注': r.remark || '',
      '充值时间': new Date(r.createdAt).toLocaleString('zh-CN'),
    }));

    return this.generateFile(rows, format, '充值记录');
  }

  /**
   * Export staff statistics for a shop
   */
  async exportStaffStats(shopId: string, format: ExportFormat): Promise<Buffer> {
    const staffList = await this.prisma.staff.findMany({
      where: { shopId, isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    const roleMap: Record<string, string> = {
      OWNER: '店主',
      MANAGER: '店长',
      RECEPTIONIST: '前台',
      STYLIST: '发型师',
      TECHNICIAN: '技师',
    };

    const stats = await Promise.all(
      staffList.map(async (staff) => {
        const orderItems = await this.prisma.orderItem.findMany({
          where: {
            staffId: staff.id,
            order: {
              shopId,
              status: 'SETTLED',
            },
          },
          include: {
            serviceItem: {
              include: { category: true },
            },
          },
        });

        const totalServices = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = orderItems.reduce((sum, item) => sum + item.finalPrice, 0);

        const categoryMap = new Map<string, { name: string; count: number; revenue: number }>();
        orderItems.forEach((item) => {
          const cat = item.serviceItem.category;
          if (!cat) return;
          const existing = categoryMap.get(cat.id);
          if (existing) {
            existing.count += item.quantity;
            existing.revenue += item.finalPrice;
          } else {
            categoryMap.set(cat.id, {
              name: cat.name,
              count: item.quantity,
              revenue: item.finalPrice,
            });
          }
        });

        const topCategory = Array.from(categoryMap.values()).sort(
          (a, b) => b.revenue - a.revenue,
        )[0];

        return {
          '员工姓名': staff.name,
          '角色': roleMap[staff.role] || staff.role,
          '总服务次数': totalServices,
          '总营收(分)': totalRevenue,
          '服务类型数': categoryMap.size,
          '主要服务类型': topCategory?.name || '',
          '主要类型营收(分)': topCategory?.revenue || 0,
        };
      }),
    );

    return this.generateFile(stats, format, '员工统计');
  }

  /**
   * Generate Excel or CSV file buffer from data rows
   */
  private generateFile(
    data: Record<string, unknown>[],
    format: ExportFormat,
    sheetName: string,
  ): Buffer {
    if (data.length === 0) {
      data = [{}];
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      // UTF-8 BOM for Excel compatibility
      const bom = Buffer.from('﻿', 'utf8');
      return Buffer.concat([bom, Buffer.from(csvOutput, 'utf8')]);
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Get content type for the export format
   */
  getContentType(format: ExportFormat): string {
    if (format === 'csv') {
      return 'text/csv; charset=utf-8';
    }
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  /**
   * Get file extension for the export format
   */
  getFileExtension(format: ExportFormat): string {
    return format === 'csv' ? '.csv' : '.xlsx';
  }

  /**
   * Generate a meaningful filename with Chinese label and date
   */
  generateFileName(label: string, format: ExportFormat): string {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '-');
    const ext = this.getFileExtension(format);
    return `${label}_${dateStr}${ext}`;
  }
}
