import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const loginSchema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  shopId: z.string().optional(),
});

export const createMemberSchema = z.object({
  name: z.string().min(1).max(50),
  phone: z.string().min(1).max(20),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthday: z.string().date().optional(),
  memberLevelId: z.string().optional(),
  remark: z.string().max(500).optional(),
});

export const rechargeSchema = z.object({
  planId: z.string().optional(),
  amount: z.number().int().min(1),
  giftAmount: z.number().int().min(0).default(0),
  payMethod: z.string().min(1),
  remark: z.string().max(200).optional(),
});

export const createOrderSchema = z.object({
  memberId: z.string().min(1),
  items: z.array(z.object({
    serviceItemId: z.string().min(1),
    staffId: z.string().min(1),
    quantity: z.number().int().min(1).default(1),
  })).min(1),
  remark: z.string().max(500).optional(),
});

export const settleOrderSchema = z.object({
  payments: z.array(z.object({
    method: z.enum(['BALANCE', 'PASS_CARD', 'OFFLINE', 'COUPON']),
    amount: z.number().int().min(0),
    detail: z.string().max(100).optional(),
    passCardId: z.string().optional(),
    couponInstanceId: z.string().optional(),
  })).min(1),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type RechargeInput = z.infer<typeof rechargeSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type SettleOrderInput = z.infer<typeof settleOrderSchema>;
