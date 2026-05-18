'use client';

import { useState, useEffect } from 'react';
import { createPassCard, getPassCards, type PassCard, type CreatePassCardInput } from '@/lib/api/pass-cards';
import { getServiceItems, type ServiceItem } from '@/lib/api/orders';

interface PassCardPurchaseDialogProps {
  memberId: string;
  memberName: string;
  onSuccess?: (passCard: PassCard) => void;
  onClose: () => void;
}

interface ServicePreset {
  id: string;
  name: string;
  recommendedTimes: number;
  defaultPrice: number;
}

const COMMON_PRESETS: ServicePreset[] = [
  { id: 'haircut', name: '剪发10次卡', recommendedTimes: 10, defaultPrice: 0 },
  { id: 'haircut-5', name: '剪发5次卡', recommendedTimes: 5, defaultPrice: 0 },
  { id: 'color', name: '染发3次卡', recommendedTimes: 3, defaultPrice: 0 },
  { id: 'perm', name: '烫发2次卡', recommendedTimes: 2, defaultPrice: 0 },
  { id: 'wash', name: '洗吹20次卡', recommendedTimes: 20, defaultPrice: 0 },
];

export function PassCardPurchaseDialog({
  memberId,
  memberName,
  onSuccess,
  onClose,
}: PassCardPurchaseDialogProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ServicePreset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    totalTimes: 10,
    price: 0,
    expiresAt: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await getServiceItems();
      setServices(data);
    } catch {
      // Handle error silently
    }
  };

  const handlePresetSelect = (preset: ServicePreset) => {
    setSelectedPreset(preset);
    const service = services.find((s) => s.name.includes(preset.name.split('次')[0]));
    setFormData({
      name: preset.name,
      totalTimes: preset.recommendedTimes,
      price: service ? Math.floor(service.price * preset.recommendedTimes * 0.8) / 100 : 0,
      expiresAt: getDefaultExpiryDate(),
    });
  };

  const getDefaultExpiryDate = (): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  const handleCreate = async () => {
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
      const input: CreatePassCardInput = {
        memberId,
        name: formData.name.trim(),
        totalTimes: formData.totalTimes,
        price: Math.round(formData.price * 100),
        expiresAt: formData.expiresAt || undefined,
        isActive: true,
      };

      const passCard = await createPassCard(input);
      onSuccess?.(passCard);
      onClose();
    } catch (error: unknown) {
      alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">购买次卡</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-accent/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">会员</div>
            <div className="font-medium">{memberName}</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">快速选择</label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                    selectedPreset?.id === preset.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
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

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              {loading ? '处理中...' : '创建次卡'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}