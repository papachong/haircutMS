import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

interface CreateTagGroupData {
  name: string;
}

interface UpdateTagGroupData {
  name?: string;
}

interface CreateTagData {
  name: string;
}

interface UpdateTagData {
  name: string;
}

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  // --- Tag Groups ---

  async findAllGroups(shopId: string) {
    return this.prisma.memberTagGroup.findMany({
      where: { shopId },
      include: {
        tags: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findGroupById(id: string, shopId: string) {
    const group = await this.prisma.memberTagGroup.findFirst({
      where: { id, shopId },
      include: { tags: { orderBy: { name: 'asc' } } },
    });

    if (!group) {
      throw new NotFoundException('Tag group not found');
    }

    return group;
  }

  async createGroup(shopId: string, data: CreateTagGroupData) {
    return this.prisma.memberTagGroup.create({
      data: { shopId, name: data.name },
      include: { tags: true },
    });
  }

  async updateGroup(id: string, shopId: string, data: UpdateTagGroupData) {
    const existing = await this.prisma.memberTagGroup.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Tag group not found');
    }

    return this.prisma.memberTagGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
      },
      include: { tags: { orderBy: { name: 'asc' } } },
    });
  }

  async deleteGroup(id: string, shopId: string) {
    const group = await this.prisma.memberTagGroup.findFirst({
      where: { id, shopId },
      include: { _count: { select: { tags: true } } },
    });

    if (!group) {
      throw new NotFoundException('Tag group not found');
    }

    await this.prisma.memberTagGroup.delete({ where: { id } });
    return { id };
  }

  // --- Tags ---

  async findTagById(id: string, shopId: string) {
    const tag = await this.prisma.memberTag.findFirst({
      where: { id, group: { shopId } },
      include: { group: true },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async createTag(groupId: string, shopId: string, data: CreateTagData) {
    const group = await this.prisma.memberTagGroup.findFirst({
      where: { id: groupId, shopId },
    });

    if (!group) {
      throw new NotFoundException('Tag group not found');
    }

    // Check if tag with same name already exists in this group
    const existingTag = await this.prisma.memberTag.findFirst({
      where: { groupId, name: data.name },
    });

    if (existingTag) {
      throw new BadRequestException('Tag with this name already exists in this group');
    }

    return this.prisma.memberTag.create({
      data: { groupId, name: data.name },
      include: { group: true },
    });
  }

  async updateTag(id: string, shopId: string, data: UpdateTagData) {
    const tag = await this.prisma.memberTag.findFirst({
      where: { id, group: { shopId } },
      include: { group: true },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Check if tag with same name already exists in this group
    const existingTag = await this.prisma.memberTag.findFirst({
      where: {
        groupId: tag.groupId,
        name: data.name,
        id: { not: id },
      },
    });

    if (existingTag) {
      throw new BadRequestException('Tag with this name already exists in this group');
    }

    return this.prisma.memberTag.update({
      where: { id },
      data: { name: data.name },
      include: { group: true },
    });
  }

  async deleteTag(id: string, shopId: string) {
    const tag = await this.prisma.memberTag.findFirst({
      where: { id, group: { shopId } },
      include: { _count: { select: { memberRelations: true } } },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.memberTag.delete({ where: { id } });
    return { id };
  }

  // --- Member Tags ---

  async getMemberTags(memberId: string, shopId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
      include: {
        tagRelations: {
          include: {
            tag: {
              include: { group: true },
            },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member.tagRelations.map((relation) => ({
      id: relation.tagId,
      name: relation.tag.name,
      group: relation.tag.group,
      assignedAt: relation.createdAt,
    }));
  }

  async setMemberTags(memberId: string, shopId: string, tagIds: string[]) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Verify all tag IDs belong to the shop
    if (tagIds.length > 0) {
      const tags = await this.prisma.memberTag.findMany({
        where: {
          id: { in: tagIds },
          group: { shopId },
        },
      });

      if (tags.length !== tagIds.length) {
        throw new BadRequestException('One or more tags not found or do not belong to this shop');
      }
    }

    // Replace all tags
    await this.prisma.memberTagRelation.deleteMany({
      where: { memberId },
    });

    if (tagIds.length > 0) {
      await this.prisma.memberTagRelation.createMany({
        data: tagIds.map((tagId) => ({ memberId, tagId })),
        skipDuplicates: true,
      });
    }

    return this.getMemberTags(memberId, shopId);
  }

  async addMemberTag(memberId: string, shopId: string, tagId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const tag = await this.prisma.memberTag.findFirst({
      where: { id: tagId, group: { shopId } },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found or does not belong to this shop');
    }

    // Check if already assigned
    const existingRelation = await this.prisma.memberTagRelation.findUnique({
      where: { memberId_tagId: { memberId, tagId } },
    });

    if (existingRelation) {
      throw new BadRequestException('Tag already assigned to this member');
    }

    await this.prisma.memberTagRelation.create({
      data: { memberId, tagId },
    });

    return this.getMemberTags(memberId, shopId);
  }

  async removeMemberTag(memberId: string, shopId: string, tagId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const tag = await this.prisma.memberTag.findFirst({
      where: { id: tagId, group: { shopId } },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found or does not belong to this shop');
    }

    await this.prisma.memberTagRelation.delete({
      where: { memberId_tagId: { memberId, tagId } },
    });

    return this.getMemberTags(memberId, shopId);
  }

  // --- System Auto Tags ---

  /**
   * Get system auto tags for a member
   * - "新会员": Member registered less than 30 days ago
   * - "沉睡会员": Member's last visit was more than 90 days ago
   */
  async getSystemAutoTags(memberId: string, shopId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const autoTags: string[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Check for new member (< 30 days)
    if (member.createdAt > thirtyDaysAgo) {
      autoTags.push('新会员');
    }

    // Check for dormant member (> 90 days since last visit)
    if (member.lastVisitAt && member.lastVisitAt < ninetyDaysAgo) {
      autoTags.push('沉睡会员');
    }

    return {
      memberId,
      tags: autoTags,
      criteria: {
        isNewMember: member.createdAt > thirtyDaysAgo,
        isDormant: member.lastVisitAt ? member.lastVisitAt < ninetyDaysAgo : false,
      },
    };
  }
}