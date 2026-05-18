'use client';

import { useState, useEffect } from 'react';
import {
  getPassCards,
  createPassCard,
  type PassCard,
} from '../../../lib/api/pass-cards';
import { searchMembers, type Member } from '../../../lib/api/orders';
import { getPassCardStatusLabel, getPassCardStatusColor } from '@/lib/api/pass-cards';

export default function PassCardsPage() {
  const [passCards, setPassCards] = useState<PassCard[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalTimes: 10,
    price: 0,
    expiresAt: '',
  });

  useEffect(() => {
    loadPassCards();
  }, []);

  const loadPassCards = async () => {
    try {
      const result = await getPassCards();
      setPassCards(result.items);
    } catch (error) {
      console.error('Failed to load pass cards:', error);
    }
  };

  const handleMemberSearch = async (value: string) => {
    setMemberSearch(value);
    if (value.length >= 2) {
      const results = await searchMembers(value);
      setMembers(results);
    } else {
      setMembers([]);
    }
  };

  const selectMember = (member: Member) => {
    setSelectedMember(member);
    setMemberSearch('');
    setMembers([]);
  };

  const handleCreate = async () => {
    if (!selectedMember) {
      alert('请选择会员');
      return;
    }
    if (!formData.name.trim()) {
      alert('请输入次卡名称');
      return;
    }
    if (formData.totalTimes <= 0) {
      alert('次数必须大于0');
      return;
    }
    if (formData.price < 0) {
      alert('价格不能为负数');
      return;
    }

    setLoading(true);
    try {
      await createPassCard({
        memberId: selectedMember.id,
        name: formData.name.trim(),
        totalTimes: formData.totalTimes,
        price: Math.round(formData.price * 100),
        expiresAt: formData.expiresAt || undefined,
        isActive: true,
      });

      alert('次卡创建成功');
      setShowCreateForm(false);
      setFormData({ name: '', totalTimes: 10, price: 0, expiresAt: '' });
      setSelectedMember(null);
      loadPassCards();
    } catch (error: unknown) {
      alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">次卡管理</h1>
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          {showCreateForm ? '取消' : '购买次卡'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-4">购买次卡</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">选择会员</label>
              <div className="relative">
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => handleMemberSearch(e.target.value)}
                  placeholder="搜索姓名/手机号/卡号"
                  className="w-full px-3 py-2 border rounded-md"
                />
                {members.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto z-10">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => selectMember(member)}
                        className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                      >
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {member.cardNo} · {member.phone}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedMember && (
                <div className="mt-2 p-2 bg-accent rounded-md text-sm">
                  已选择: {selectedMember.name} ({selectedMember.cardNo})
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">次卡名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如: 剪发10次卡"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">次数</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalTimes}
                  onChange={(e) => setFormData({ ...formData, totalTimes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">价格 (元)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">有效期 (可选)</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-muted-foreground mt-1">留空则永久有效</p>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? '处理中...' : '创建次卡'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-lg">
        <div className="grid grid-cols-6 gap-4 p-4 border-b font-medium text-sm">
          <div>次卡名称</div>
          <div>会员</div>
          <div>次数</div>
          <div>价格</div>
          <div>有效期</div>
          <div>状态</div>
        </div>
        {passCards.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            暂无次卡
          </div>
        ) : (
          <div>
            {passCards.map((card) => {
              const daysUntilExpiry = getDaysUntilExpiry(card.expiresAt);
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

              return (
                <div
                  key={card.id}
                  className="grid grid-cols-6 gap-4 p-4 border-b text-sm hover:bg-accent"
                >
                  <div className="font-medium">{card.name}</div>
                  <div>
                    {card.member?.name}
                    <div className="text-xs text-muted-foreground">{card.member?.cardNo}</div>
                  </div>
                  <div>
                    <span className="font-medium">{card.remainingTimes}</span>
                    <span className="text-muted-foreground"> / {card.totalTimes}</span>
                  </div>
                  <div>¥{(card.price / 100).toFixed(2)}</div>
                  <div className="text-muted-foreground">
                    {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString('zh-CN') : '永久'}
                    {isExpiringSoon && (
                      <span className="ml-2 text-orange-600 text-xs">({daysUntilExpiry}天后过期)</span>
                    )}
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getPassCardStatusColor(card.status)}`}>
                      {getPassCardStatusLabel(card.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}