'use client';

import { useEffect, useState } from 'react';
import {
  getStaffList,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  resetStaffPassword,
  type Staff,
  type StaffRole,
  type CreateStaffInput,
  STAFF_ROLE_LABELS,
} from '@/lib/api/staff';
import { Plus, Edit2, KeyRound, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface StaffFormData {
  name: string;
  phone: string;
  password: string;
  role: StaffRole;
}

interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'reset-password';
  staff?: Staff;
}

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'create' });
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    phone: '',
    password: '',
    role: 'STYLIST',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStaffList();
  }, []);

  async function loadStaffList() {
    setLoading(true);
    try {
      const data = await getStaffList();
      setStaffList(data);
    } catch (err) {
      setError('加载员工列表失败');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setModal({ isOpen: true, mode: 'create' });
    setFormData({ name: '', phone: '', password: '', role: 'STYLIST' });
    setError(null);
  }

  function openEditModal(staff: Staff) {
    setModal({ isOpen: true, mode: 'edit', staff });
    setFormData({
      name: staff.name,
      phone: staff.phone,
      password: '',
      role: staff.role as StaffRole,
    });
    setError(null);
  }

  function openResetPasswordModal(staff: Staff) {
    setModal({ isOpen: true, mode: 'reset-password', staff });
    setFormData({ name: staff.name, phone: staff.phone, password: '', role: staff.role as StaffRole });
    setError(null);
  }

  function closeModal() {
    setModal({ isOpen: false, mode: 'create' });
    setFormData({ name: '', phone: '', password: '', role: 'STYLIST' });
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      if (modal.mode === 'create') {
        if (!formData.name || !formData.phone || !formData.password) {
          setError('请填写完整信息');
          return;
        }
        await createStaff(formData as CreateStaffInput);
        setSuccessMessage('员工添加成功');
      } else if (modal.mode === 'edit' && modal.staff) {
        await updateStaff(modal.staff.id, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
        });
        setSuccessMessage('员工信息更新成功');
      } else if (modal.mode === 'reset-password' && modal.staff) {
        if (!formData.password) {
          setError('请输入新密码');
          return;
        }
        await resetStaffPassword(modal.staff.id, formData.password);
        setSuccessMessage('密码重置成功');
      }

      closeModal();
      await loadStaffList();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(staff: Staff) {
    try {
      await toggleStaffStatus(staff.id);
      await loadStaffList();
      setSuccessMessage(staff.isActive ? '员工已停用' : '员工已启用');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('操作失败');
    }
  }

  const activeStaffCount = staffList.filter(s => s.isActive).length;
  const totalStaffCount = staffList.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">员工管理</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            管理店铺员工信息、角色和权限
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          添加员工
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-xl border bg-card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-green-600" />
            <span className="text-xs text-muted-foreground">在职员工</span>
          </div>
          <p className="mt-3 md:mt-4 text-2xl md:text-3xl font-bold text-green-600">{activeStaffCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <XCircle className="h-4 md:h-5 w-4 md:w-5 text-red-600" />
            <span className="text-xs text-muted-foreground">已停用</span>
          </div>
          <p className="mt-3 md:mt-4 text-2xl md:text-3xl font-bold text-red-600">{totalStaffCount - activeStaffCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <Edit2 className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
            <span className="text-xs text-muted-foreground">发型师</span>
          </div>
          <p className="mt-3 md:mt-4 text-2xl md:text-3xl font-bold text-blue-600">
            {staffList.filter(s => s.role === 'STYLIST' && s.isActive).length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 md:p-6">
          <div className="flex items-center justify-between">
            <AlertTriangle className="h-4 md:h-5 w-4 md:w-5 text-amber-600" />
            <span className="text-xs text-muted-foreground">员工总数</span>
          </div>
          <p className="mt-3 md:mt-4 text-2xl md:text-3xl font-bold">{totalStaffCount}</p>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-lg border border-green-500 bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-950/20 dark:text-green-200">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-4 px-4 md:px-6 text-left font-medium">姓名</th>
                <th className="py-4 px-4 md:px-6 text-left font-medium">角色</th>
                <th className="py-4 px-4 md:px-6 text-left font-medium">手机号</th>
                <th className="py-4 px-4 md:px-6 text-left font-medium">状态</th>
                <th className="py-4 px-4 md:px-6 text-left font-medium">入职时间</th>
                <th className="py-4 px-4 md:px-6 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    加载中...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    暂无员工数据
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-4 px-4 md:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {staff.name.charAt(0)}
                        </div>
                        <span className="font-medium">{staff.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {STAFF_ROLE_LABELS[staff.role as StaffRole]}
                      </span>
                    </td>
                    <td className="py-4 px-4 md:px-6 text-muted-foreground">{staff.phone}</td>
                    <td className="py-4 px-4 md:px-6">
                      {staff.isActive ? (
                        <span className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">在职</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">已停用</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 md:px-6 text-muted-foreground">
                      {new Date(staff.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(staff)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="编辑"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(staff)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="重置密码"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          className={`rounded-md p-2 ${
                            staff.isActive
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={staff.isActive ? '停用' : '启用'}
                        >
                          {staff.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">加载中...</div>
          ) : staffList.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">暂无员工数据</div>
          ) : (
            staffList.map((staff) => (
              <div key={staff.id} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                      {staff.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm sm:text-base">{staff.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{staff.phone}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 sm:px-3 py-1 text-xs font-medium text-primary shrink-0">
                    {STAFF_ROLE_LABELS[staff.role as StaffRole]}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">状态</span>
                  {staff.isActive ? (
                    <span className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>在职</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>已停用</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">入职时间</span>
                  <span>{new Date(staff.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => openEditModal(staff)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="编辑"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openResetPasswordModal(staff)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="重置密码"
                  >
                    <KeyRound className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(staff)}
                    className={`rounded-md p-2 ${
                      staff.isActive
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={staff.isActive ? '停用' : '启用'}
                  >
                    {staff.isActive ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-4 sm:p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="mb-6 text-xl font-bold">
              {modal.mode === 'create' && '添加员工'}
              {modal.mode === 'edit' && '编辑员工'}
              {modal.mode === 'reset-password' && '重置密码'}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900 dark:bg-red-950/20 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入姓名"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">手机号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入手机号"
                />
              </div>

              {modal.mode === 'create' && (
                <div>
                  <label className="mb-2 block text-sm font-medium">初始密码</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="请输入初始密码"
                  />
                </div>
              )}

              {modal.mode === 'reset-password' && (
                <div>
                  <label className="mb-2 block text-sm font-medium">新密码</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="请输入新密码"
                  />
                </div>
              )}

              {(modal.mode === 'create' || modal.mode === 'edit') && (
                <div>
                  <label className="mb-2 block text-sm font-medium">角色</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                    className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}