'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, User, Phone, Calendar, MoreVertical } from 'lucide-react';
import {
  getMembers,
  type Member,
  type MemberListParams,
} from '../../../lib/api/members';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberLevels, setMemberLevels] = useState<Array<{ id: string; name: string; discount: number }>>([]);

  useEffect(() => {
    loadMembers();
    loadMemberLevels();
  }, [currentPage, pageSize]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
      loadMembers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchKeyword]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const params: MemberListParams = {
        page: currentPage,
        pageSize,
      };

      if (searchKeyword.trim()) {
        params.keyword = searchKeyword.trim();
      }

      const result = await getMembers(params);
      setMembers(result.items);
      setTotal(result.pagination.total);
      setHasMore(result.pagination.hasMore);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberLevels = async () => {
    try {
      const res = await fetch('/api/v1/member-levels');
      const data = await res.json();
      if (data.code === 0) {
        setMemberLevels(data.data);
      }
    } catch (error) {
      console.error('Failed to load member levels:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);
  };

  const handleCreateMember = () => {
    setSelectedMember(null);
    setShowCreateDialog(true);
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setShowCreateDialog(true);
  };

  const handleMemberSaved = () => {
    setShowCreateDialog(false);
    loadMembers();
  };

  const totalPages = Math.ceil(total / pageSize);

  const getMemberLevelName = (levelId: string) => {
    const level = memberLevels.find(l => l.id === levelId);
    return level?.name || '未知等级';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">会员管理</h1>
        <button
          type="button"
          onClick={handleCreateMember}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">新建会员</span>
          <span className="sm:hidden">新建</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="搜索姓名/手机号/卡号"
          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-card border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">会员总数</div>
          <div className="text-xl sm:text-2xl font-bold mt-1">{total}</div>
        </div>
        <div className="bg-card border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">本金余额</div>
          <div className="text-xl sm:text-2xl font-bold mt-1">
            ¥{(members.reduce((sum, m) => sum + m.principalBalance, 0) / 100).toFixed(2)}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">赠送余额</div>
          <div className="text-xl sm:text-2xl font-bold mt-1">
            ¥{(members.reduce((sum, m) => sum + m.giftBalance, 0) / 100).toFixed(2)}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">今日新增</div>
          <div className="text-xl sm:text-2xl font-bold mt-1">
            {members.filter(m => {
              const today = new Date();
              const createdAt = new Date(m.createdAt);
              return createdAt.toDateString() === today.toDateString();
            }).length}
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="bg-card border rounded-lg overflow-hidden hidden md:block">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
          <div className="col-span-2">会员信息</div>
          <div className="col-span-2">会员等级</div>
          <div className="col-span-2">余额</div>
          <div className="col-span-2">消费统计</div>
          <div className="col-span-2">最后消费</div>
          <div className="col-span-2">操作</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchKeyword ? '未找到匹配的会员' : '暂无会员数据'}
          </div>
        ) : (
          members.map((member) => (
            <Link
              key={member.id}
              href={`/admin/members/${member.id}`}
              className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-accent/50 transition-colors"
            >
              <div className="col-span-2">
                <div className="flex items-center gap-3">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.cardNo}</div>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-sm font-medium">{getMemberLevelName(member.memberLevelId)}</div>
                <div className="text-xs text-primary">
                  {memberLevels.find(l => l.id === member.memberLevelId)?.discount ? (memberLevels.find(l => l.id === member.memberLevelId)!.discount * 10).toFixed(0) : '10'}折
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-sm">
                  本金: <span className="font-medium">¥{(member.principalBalance / 100).toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  赠送: ¥{(member.giftBalance / 100).toFixed(2)}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-sm">
                  总消费: <span className="font-medium">¥{(member.totalConsume / 100).toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  次数: {member.visitCount}次
                </div>
              </div>

              <div className="col-span-2">
                {member.lastVisitAt ? (
                  <div className="text-sm">
                    {new Date(member.lastVisitAt).toLocaleDateString('zh-CN')}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">暂无消费</div>
                )}
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEditMember(member);
                  }}
                  className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md"
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchKeyword ? '未找到匹配的会员' : '暂无会员数据'}
          </div>
        ) : (
          members.map((member) => (
            <Link
              key={member.id}
              href={`/admin/members/${member.id}`}
              className="bg-card border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground">{member.cardNo}</div>
                  <div className="text-xs text-primary mt-1">
                    {getMemberLevelName(member.memberLevelId)} · {(memberLevels.find(l => l.id === member.memberLevelId)?.discount || 1) * 10}折
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground text-xs">本金余额</div>
                  <div className="font-medium">¥{(member.principalBalance / 100).toFixed(2)}</div>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground text-xs">赠送余额</div>
                  <div className="font-medium">¥{(member.giftBalance / 100).toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  总消费: ¥{(member.totalConsume / 100).toFixed(2)}
                </div>
                <div className="text-muted-foreground">
                  {member.visitCount}次消费
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            下一页
          </button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <MemberFormDialog
          member={selectedMember}
          memberLevels={memberLevels}
          onClose={() => setShowCreateDialog(false)}
          onSaved={handleMemberSaved}
        />
      )}
    </div>
  );
}

interface MemberFormDialogProps {
  member: Member | null;
  memberLevels: Array<{ id: string; name: string; discount: number }>;
  onClose: () => void;
  onSaved: () => void;
}

function MemberFormDialog({ member, memberLevels, onClose, onSaved }: MemberFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
    gender: member?.gender || '',
    birthday: member?.birthday ? new Date(member.birthday).toISOString().split('T')[0] : '',
    memberLevelId: member?.memberLevelId || '',
    remark: member?.remark || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('请输入会员姓名');
      return;
    }
    if (!formData.phone.trim()) {
      alert('请输入手机号');
      return;
    }
    if (!/^1\d{10}$/.test(formData.phone)) {
      alert('请输入正确的手机号');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const url = member
        ? `/api/v1/members/${member.id}`
        : '/api/v1/members';

      const response = await fetch(url, {
        method: member ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          memberLevelId: formData.memberLevelId || undefined,
          birthday: formData.birthday || undefined,
          gender: formData.gender || undefined,
        }),
      });

      const data = await response.json();

      if (data.code === 0) {
        onSaved();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error: unknown) {
      alert(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">{member ? '编辑会员' : '新建会员'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              会员姓名 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入会员姓名"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              手机号码 <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入手机号"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {member && (
              <p className="text-xs text-muted-foreground mt-1">
                卡号: {member.cardNo}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">性别</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">请选择</option>
                <option value="MALE">男</option>
                <option value="FEMALE">女</option>
                <option value="OTHER">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">生日</label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">会员等级</label>
            <select
              value={formData.memberLevelId}
              onChange={(e) => setFormData({ ...formData, memberLevelId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {memberLevels.length > 0 ? (
                memberLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name} ({(level.discount * 10).toFixed(0)}折)
                  </option>
                ))
              ) : (
                <option value="">默认等级</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">备注</label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="选填备注信息"
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? '处理中...' : member ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}