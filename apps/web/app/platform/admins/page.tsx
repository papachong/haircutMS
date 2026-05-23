'use client';

import { useState, useEffect } from 'react';
import {
  getPlatformAdmins,
  createPlatformAdmin,
  updatePlatformAdmin,
  resetAdminPassword,
  toggleAdminActive,
  type PlatformAdminInfo,
} from '@/lib/api/platform';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  OPERATOR: '操作员',
};

interface ModalState {
  type: 'create' | 'edit' | 'resetPassword' | null;
  admin?: PlatformAdminInfo;
}

export default function PlatformAdminsPage() {
  const [admins, setAdmins] = useState<PlatformAdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'OPERATOR' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    try {
      const res = await getPlatformAdmins();
      setAdmins(res.data);
    } catch {
      setMessage({ type: 'error', text: '加载管理员列表失败' });
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ name: '', phone: '', password: '', role: 'OPERATOR' });
    setModal({ type: 'create' });
  }

  function openEdit(admin: PlatformAdminInfo) {
    setForm({ name: admin.name, phone: admin.phone, password: '', role: admin.role });
    setModal({ type: 'edit', admin });
  }

  function openResetPassword(admin: PlatformAdminInfo) {
    setForm({ ...form, password: '' });
    setModal({ type: 'resetPassword', admin });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createPlatformAdmin(form);
      setMessage({ type: 'success', text: '管理员创建成功' });
      setModal({ type: null });
      loadAdmins();
    } catch {
      setMessage({ type: 'error', text: '创建失败' });
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!modal.admin) return;
    setSaving(true);
    try {
      await updatePlatformAdmin(modal.admin.id, {
        name: form.name,
        phone: form.phone,
        role: form.role,
      });
      setMessage({ type: 'success', text: '管理员信息已更新' });
      setModal({ type: null });
      loadAdmins();
    } catch {
      setMessage({ type: 'error', text: '更新失败' });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!modal.admin) return;
    setSaving(true);
    try {
      await resetAdminPassword(modal.admin.id, form.password);
      setMessage({ type: 'success', text: '密码已重置' });
      setModal({ type: null });
    } catch {
      setMessage({ type: 'error', text: '重置失败' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(admin: PlatformAdminInfo) {
    try {
      await toggleAdminActive(admin.id);
      setMessage({
        type: 'success',
        text: admin.isActive ? '已停用' : '已启用',
      });
      loadAdmins();
    } catch {
      setMessage({ type: 'error', text: '操作失败' });
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">管理员管理</h1>
          <p className="text-sm text-slate-600 mt-1">管理平台管理员账号、角色和权限</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 新增管理员
        </button>
      </div>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Admin List Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">姓名</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">手机号</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">角色</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">创建时间</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{admin.name}</td>
                <td className="px-4 py-3 text-slate-600">{admin.phone}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      admin.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : admin.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {ROLE_LABELS[admin.role] || admin.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      admin.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {admin.isActive ? '正常' : '已停用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(admin.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(admin)}
                      className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => openResetPassword(admin)}
                      className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      重置密码
                    </button>
                    <button
                      onClick={() => handleToggleActive(admin)}
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        admin.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {admin.isActive ? '停用' : '启用'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  暂无管理员
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Overlay */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {modal.type === 'create' && '新增管理员'}
              {modal.type === 'edit' && '编辑管理员'}
              {modal.type === 'resetPassword' && '重置密码'}
            </h2>

            <form
              onSubmit={
                modal.type === 'create'
                  ? handleCreate
                  : modal.type === 'edit'
                    ? handleEdit
                    : handleResetPassword
              }
              className="space-y-4"
            >
              {(modal.type === 'create' || modal.type === 'edit') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">角色</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="SUPER_ADMIN">超级管理员</option>
                      <option value="ADMIN">管理员</option>
                      <option value="OPERATOR">操作员</option>
                    </select>
                  </div>
                </>
              )}

              {(modal.type === 'create' || modal.type === 'resetPassword') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {modal.type === 'create' ? '登录密码' : '新密码'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="至少6位"
                    className="flex h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '处理中...' : '确认'}
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ type: null })}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
