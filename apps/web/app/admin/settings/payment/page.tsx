'use client';

import { useState, useEffect } from 'react';

const DEFAULT_METHODS = [
  { id: 'cash', label: '现金', enabled: true },
  { id: 'wechat', label: '微信转账', enabled: true },
  { id: 'alipay', label: '支付宝', enabled: true },
  { id: 'card', label: '银行卡', enabled: false },
  { id: 'other', label: '其他', enabled: false },
];

const STORAGE_KEY = 'paymentMethods';

interface PaymentMethod {
  id: string;
  label: string;
  enabled: boolean;
}

export default function PaymentConfigPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setMethods(JSON.parse(stored));
      } catch {
        setMethods(DEFAULT_METHODS);
      }
    } else {
      setMethods(DEFAULT_METHODS);
    }
  }, []);

  function save(updated: PaymentMethod[]) {
    setMethods(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setMessage({ type: 'success', text: '已保存' });
  }

  function toggleMethod(id: string) {
    save(methods.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
  }

  function addCustomMethod() {
    const label = newLabel.trim();
    if (!label) return;
    if (methods.some((m) => m.label === label)) {
      setMessage({ type: 'error', text: '该支付方式已存在' });
      return;
    }
    const id = `custom_${Date.now()}`;
    save([...methods, { id, label, enabled: true }]);
    setNewLabel('');
  }

  function removeMethod(id: string) {
    save(methods.filter((m) => m.id !== id));
  }

  function resetToDefault() {
    save(DEFAULT_METHODS);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">支付配置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          配置线下支付方式选项，用于收银结算时记录客户的付款方式
        </p>
      </div>

      {message && (
        <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Enabled Methods */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4">支付方式</h2>
        <div className="space-y-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={() => toggleMethod(method.id)}
                    className="accent-primary h-4 w-4"
                  />
                  <span className="text-sm font-medium">{method.label}</span>
                </label>
              </div>
              {method.id.startsWith('custom_') && (
                <button
                  onClick={() => removeMethod(method.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  删除
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Method */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4">添加自定义支付方式</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="输入支付方式名称"
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addCustomMethod()}
          />
          <button
            onClick={addCustomMethod}
            disabled={!newLabel.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            添加
          </button>
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <button
          onClick={resetToDefault}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          恢复默认配置
        </button>
      </div>

      {/* Note */}
      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>系统仅记录线下支付方式和金额，不处理实际资金流转。客户通过微信、支付宝、现金等方式自行付款后，前台在收银结算时选择对应支付方式进行记录。</p>
      </div>
    </div>
  );
}
