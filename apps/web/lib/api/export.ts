const BASE_URL = '/api/v1';

type ExportFormat = 'xlsx' | 'csv';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

async function fetchExport(path: string, fileName: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '导出失败' }));
    throw new Error(errorData.message || '导出失败');
  }

  const blob = await response.blob();
  triggerDownload(blob, fileName);
}

export async function exportMembers(format: ExportFormat = 'xlsx'): Promise<void> {
  const dateStr = new Date().toISOString().split('T')[0];
  await fetchExport(
    `/export/members?format=${format}`,
    `会员列表_${dateStr}.${format === 'csv' ? 'csv' : 'xlsx'}`,
  );
}

export async function exportOrders(
  format: ExportFormat = 'xlsx',
  startDate?: string,
  endDate?: string,
): Promise<void> {
  const params = new URLSearchParams({ format });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const dateStr = new Date().toISOString().split('T')[0];
  await fetchExport(
    `/export/orders?${params.toString()}`,
    `订单数据_${dateStr}.${format === 'csv' ? 'csv' : 'xlsx'}`,
  );
}

export async function exportRechargeRecords(format: ExportFormat = 'xlsx'): Promise<void> {
  const dateStr = new Date().toISOString().split('T')[0];
  await fetchExport(
    `/export/recharge-records?format=${format}`,
    `充值记录_${dateStr}.${format === 'csv' ? 'csv' : 'xlsx'}`,
  );
}

export async function exportStaffStats(format: ExportFormat = 'xlsx'): Promise<void> {
  const dateStr = new Date().toISOString().split('T')[0];
  await fetchExport(
    `/export/staff-stats?format=${format}`,
    `员工统计_${dateStr}.${format === 'csv' ? 'csv' : 'xlsx'}`,
  );
}

export async function exportRevenueReport(
  format: ExportFormat = 'xlsx',
  startDate?: string,
  endDate?: string,
): Promise<void> {
  const params = new URLSearchParams({ format });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const dateStr = new Date().toISOString().split('T')[0];
  await fetchExport(
    `/export/orders?${params.toString()}`,
    `收入报表_${dateStr}.${format === 'csv' ? 'csv' : 'xlsx'}`,
  );
}
