import { apiFetch } from './client';

// ---------- Types ----------

export interface SpendingBreakdown {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  totalCount: number;
  percentage: number;
}

export interface VisitFrequency {
  dayOfWeek: number;
  dayLabel: string;
  count: number;
  percentage: number;
}

export interface PreferredStylist {
  staffId: string;
  staffName: string;
  visitCount: number;
  lastVisitAt: string | null;
}

export type SpendingTrend = 'increasing' | 'decreasing' | 'stable';

export interface ServicePreference {
  serviceItemId: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
  count: number;
  totalAmount: number;
}

export interface MemberProfileData {
  memberId: string;
  memberName: string;
  membershipDuration: number;
  totalVisits: number;
  totalSpent: number;
  averageSpendingPerVisit: number;
  spendingBreakdown: SpendingBreakdown[];
  visitFrequency: VisitFrequency[];
  preferredStylist: PreferredStylist | null;
  spendingTrend: SpendingTrend;
  servicePreferences: ServicePreference[];
  loyaltyScore: number;
}

export interface Recommendation {
  type: 'service' | 'recharge' | 'comeback';
  title: string;
  description: string;
  serviceItemId?: string;
  serviceName?: string;
  suggestedAmount?: number;
  priority: number;
}

export interface MonthlySpending {
  month: string;
  amount: number;
  count: number;
}

export interface ConsumptionChartData {
  monthlySpending: MonthlySpending[];
  serviceTypeDistribution: SpendingBreakdown[];
  visitFrequencyByDay: VisitFrequency[];
  avgMemberSpending: number;
  memberSpending: number;
}

// ---------- API Functions ----------

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export async function getMemberProfile(memberId: string): Promise<MemberProfileData> {
  const res = await apiFetch<ApiResponse<MemberProfileData>>(
    `/members/${memberId}/profile`,
  );
  return res.data;
}

export async function getMemberRecommendations(
  memberId: string,
): Promise<Recommendation[]> {
  const res = await apiFetch<ApiResponse<Recommendation[]>>(
    `/members/${memberId}/recommendations`,
  );
  return res.data;
}

export async function getMemberConsumptionChart(
  memberId: string,
  months: number = 12,
): Promise<ConsumptionChartData> {
  const res = await apiFetch<ApiResponse<ConsumptionChartData>>(
    `/members/${memberId}/consumption-chart?months=${months}`,
  );
  return res.data;
}
