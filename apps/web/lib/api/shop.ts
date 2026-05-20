import { apiFetch } from './client';

export interface ShopInfo {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo: string | null;
}

export async function getShopInfo(): Promise<ShopInfo> {
  const res = await apiFetch<{ code: number; data: ShopInfo }>('/auth/shop');
  return res.data;
}
