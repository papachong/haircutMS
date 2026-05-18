'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { formatCurrency } from '@haircut-ms/shared';

interface Member {
  id: string;
  cardNo: string;
  name: string;
  phone: string;
  principalBalance: number;
  giftBalance: number;
  level?: {
    name: string;
  };
  levelId?: string;
  createdAt: string;
}

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  const loadMembers = async () => {
    setLoading(true);
    try {
      let url = '/members';
      if (searchKeyword) {
        url = `/members/search/keyword?keyword=${encodeURIComponent(searchKeyword)}`;
      }
      const res = await apiFetch<{ code: number; data: Member[]; message: string }>(url);
      if (res.code === 0) {
        setMembers(res.data);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadMembers();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchKeyword]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">会员管理</h1>
        <button
          onClick={() => router.push('/admin/members/new')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          新增会员
        </button>
      </div>

      {/* Search */}
      <div className="rounded-lg border bg-card p-4">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="搜索会员号、姓名、手机号"
          className="w-full px-4 py-2 rounded-md border border-input bg-background"
        />
      </div>

      {/* Members List */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">会员号</th>
                  <th className="text-left py-3 px-4 font-medium">姓名</th>
                  <th className="text-left py-3 px-4 font-medium">手机号</th>
                  <th className="text-left py-3 px-4 font-medium">会员等级</th>
                  <th className="text-left py-3 px-4 font-medium">本金余额</th>
                  <th className="text-left py-3 px-4 font-medium">赠送余额</th>
                  <th className="text-left py-3 px-4 font-medium">注册时间</th>
                  <th className="text-left py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4">{member.cardNo}</td>
                    <td className="py-3 px-4 font-medium">{member.name}</td>
                    <td className="py-3 px-4">{member.phone}</td>
                    <td className="py-3 px-4">{member.level?.name || '普通会员'}</td>
                    <td className="py-3 px-4 text-blue-600">
                      {formatCurrency(member.principalBalance)}
                    </td>
                    <td className="py-3 px-4 text-orange-600">
                      {formatCurrency(member.giftBalance)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => router.push(`/admin/members/${member.id}`)}
                        className="text-primary hover:underline"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {searchKeyword ? '未找到匹配的会员' : '暂无会员数据'}
          </div>
        )}
      </div>
    </div>
  );
}