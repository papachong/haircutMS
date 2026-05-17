export interface RechargeResult {
  member: {
    id: string;
    cardNo: string;
    name: string;
    principalBalance: number;
    giftBalance: number;
  };
  rechargeRecord: {
    id: string;
    amount: number;
    giftAmount: number;
    payMethod: string;
    createdAt: Date;
  };
}

export interface RechargeHistoryResult {
  items: Array<{
    id: string;
    amount: number;
    giftAmount: number;
    payMethod: string;
    remark: string | null;
    createdAt: Date;
    operator: {
      id: string;
      name: string;
    };
    plan?: {
      id: string;
      name: string;
    } | null;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}