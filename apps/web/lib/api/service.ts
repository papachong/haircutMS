import { apiFetch } from "./client";

export interface ServiceCategory {
  id: string;
  name: string;
  sortOrder: number;
  _count?: {
    items: number;
  };
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  duration: number;
  image?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateCategoryInput {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  sortOrder?: number;
}

export interface CreateServiceItemInput {
  categoryId: string;
  name: string;
  price: number;
  duration: number;
  image?: string;
  sortOrder?: number;
}

export interface UpdateServiceItemInput {
  name?: string;
  price?: number;
  duration?: number;
  image?: string;
  sortOrder?: number;
}

// Category APIs
export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const res = await apiFetch<{ code: number; data: ServiceCategory[] }>(
    "/service-categories",
  );
  return res.data;
}

export async function createServiceCategory(
  data: CreateCategoryInput,
): Promise<ServiceCategory> {
  const res = await apiFetch<{ code: number; data: ServiceCategory }>(
    "/service-categories",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

export async function updateServiceCategory(
  id: string,
  data: UpdateCategoryInput,
): Promise<ServiceCategory> {
  const res = await apiFetch<{ code: number; data: ServiceCategory }>(
    `/service-categories/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

export async function deleteServiceCategory(id: string): Promise<void> {
  await apiFetch(`/service-categories/${id}`, {
    method: "DELETE",
  });
}

export async function reorderServiceCategories(ids: string[]): Promise<void> {
  await apiFetch("/service-categories/reorder", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// Service Item APIs
export async function getServiceItems(options?: {
  categoryId?: string;
  activeOnly?: boolean;
}): Promise<ServiceItem[]> {
  const params = new URLSearchParams();
  if (options?.categoryId) params.append("categoryId", options.categoryId);
  if (options?.activeOnly) params.append("activeOnly", "true");
  const path = `/service-items${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await apiFetch<{ code: number; data: ServiceItem[] }>(path);
  return res.data;
}

export async function createServiceItem(
  data: CreateServiceItemInput,
): Promise<ServiceItem> {
  const res = await apiFetch<{ code: number; data: ServiceItem }>(
    "/service-items",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

export async function updateServiceItem(
  id: string,
  data: UpdateServiceItemInput,
): Promise<ServiceItem> {
  const res = await apiFetch<{ code: number; data: ServiceItem }>(
    `/service-items/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

export async function toggleServiceItem(id: string): Promise<ServiceItem> {
  const res = await apiFetch<{ code: number; data: ServiceItem }>(
    `/service-items/${id}/toggle`,
    {
      method: "PATCH",
    },
  );
  return res.data;
}

export async function deleteServiceItem(id: string): Promise<void> {
  await apiFetch(`/service-items/${id}`, {
    method: "DELETE",
  });
}

export async function reorderServiceItems(
  categoryId: string,
  ids: string[],
): Promise<void> {
  await apiFetch("/service-items/reorder", {
    method: "POST",
    body: JSON.stringify({ categoryId, ids }),
  });
}
