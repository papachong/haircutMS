import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationService } from './notification.service';
import { NotificationTypes } from './notification.types';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  @Cron('0 9 * * *')
  async checkLicenseExpiry() {
    this.logger.log('Checking license expiry...');

    const fifteenDaysLater = new Date();
    fifteenDaysLater.setDate(fifteenDaysLater.getDate() + 15);

    const startOfDay = new Date(fifteenDaysLater);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fifteenDaysLater);
    endOfDay.setHours(23, 59, 59, 999);

    const expiringLicenses = await this.prisma.license.findMany({
      where: {
        expiresAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { shop: true },
    });

    for (const license of expiringLicenses) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existing = await this.prisma.notification.findFirst({
        where: {
          shopId: license.shopId,
          type: NotificationTypes.LICENSE_EXPIRY,
          relatedEntityId: license.id,
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (existing) continue;

      await this.notificationService.create({
        shopId: license.shopId,
        type: NotificationTypes.LICENSE_EXPIRY,
        title: '许可证即将到期',
        content: `店铺「${license.shop.name}」的许可证将于 ${license.expiresAt.toLocaleDateString('zh-CN')} 到期，请及时续费`,
        relatedEntityId: license.id,
        relatedEntityType: 'License',
      });
    }
  }

  @Cron('0 9 * * *')
  async checkPassCardExpiry() {
    this.logger.log('Checking pass card expiry...');

    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const startOfDay = new Date(sevenDaysLater);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sevenDaysLater);
    endOfDay.setHours(23, 59, 59, 999);

    const expiringCards = await this.prisma.passCard.findMany({
      where: {
        expiresAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isActive: true,
        remainingTimes: { gt: 0 },
      },
      include: {
        member: { select: { shopId: true, name: true } },
      },
    });

    for (const card of expiringCards) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existing = await this.prisma.notification.findFirst({
        where: {
          shopId: card.member.shopId,
          type: NotificationTypes.PASS_CARD_EXPIRY,
          relatedEntityId: card.id,
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (existing) continue;

      await this.notificationService.create({
        shopId: card.member.shopId,
        type: NotificationTypes.PASS_CARD_EXPIRY,
        title: '次卡即将到期',
        content: `会员「${card.member.name}」的次卡「${card.name}」将于 ${card.expiresAt!.toLocaleDateString('zh-CN')} 到期，剩余 ${card.remainingTimes} 次`,
        relatedEntityId: card.id,
        relatedEntityType: 'PassCard',
      });
    }
  }

  @Cron('0 8 * * *')
  async checkMemberBirthdays() {
    this.logger.log('Checking member birthdays...');

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const birthdayMembers = await this.prisma.member.findMany({
      where: {
        isActive: true,
        birthday: { not: null },
      },
      select: {
        id: true,
        name: true,
        birthday: true,
        shopId: true,
      },
    });

    const todayBirthdays = birthdayMembers.filter((m) => {
      if (!m.birthday) return false;
      const bd = new Date(m.birthday);
      return bd.getMonth() + 1 === month && bd.getDate() === day;
    });

    const shopsProcessed = new Map<string, string[]>();

    for (const member of todayBirthdays) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrow = new Date(todayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existing = await this.prisma.notification.findFirst({
        where: {
          shopId: member.shopId,
          type: NotificationTypes.MEMBER_BIRTHDAY,
          relatedEntityId: member.id,
          createdAt: { gte: todayStart, lt: tomorrow },
        },
      });

      if (existing) continue;

      await this.notificationService.create({
        shopId: member.shopId,
        type: NotificationTypes.MEMBER_BIRTHDAY,
        title: '会员生日提醒',
        content: `今天是会员「${member.name}」的生日，记得送上祝福`,
        relatedEntityId: member.id,
        relatedEntityType: 'Member',
      });
    }
  }
}
