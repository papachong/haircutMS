const BASE_URL = '/api/v1';

export interface ImportSummary {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface PreviewResult {
  rows: Record<string, unknown>[];
  total: number;
  columns: string[];
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function importMembers(file: File): Promise<ImportSummary> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/import/members`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(data.message || '导入失败');
  }
  return data.data;
}

export async function importServices(file: File): Promise<ImportSummary> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/import/services`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(data.message || '导入失败');
  }
  return data.data;
}

export async function previewImport(
  file: File,
  type: 'members' | 'services',
): Promise<PreviewResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/import/preview?type=${type}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(data.message || '预览失败');
  }
  return data.data;
}

export async function downloadTemplate(
  type: 'members' | 'services',
): Promise<void> {
  const response = await fetch(`${BASE_URL}/import/template/${type}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '下载模板失败' }));
    throw new Error(errorData.message || '下载模板失败');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = type === 'members' ? '会员导入模板.xlsx' : '服务导入模板.xlsx';
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
}
