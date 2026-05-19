'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getAllMemberLevels,
  createMemberLevel,
  updateMemberLevel,
  deleteMemberLevel,
  batchSortMemberLevels,
  type MemberLevel,
} from '@/lib/api/member-level';
import { Plus, Pencil, Trash2, GripVertical, Users } from 'lucide-react';

interface FormData {
  name: string;
  discount: number;
  remark: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  discount: 1.0,
  remark: '',
};

export default function MemberLevelsPage() {
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<MemberLevel | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sortSaving, setSortSaving] = useState(false);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const loadLevels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllMemberLevels();
      setLevels(res);
    } catch (error) {
      console.error('Failed to load member levels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingLevel(null);
  };

  const openModal = (level?: MemberLevel) => {
    if (level) {
      setEditingLevel(level);
      setFormData({
        name: level.name,
        discount: Number(level.discount),
        remark: level.remark ?? '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('请填写等级名称');
      return;
    }
    if (formData.discount < 0.1 || formData.discount > 1.0) {
      alert('折扣必须在 0.10 到 1.00 之间');
      return;
    }

    setSubmitting(true);
    try {
      if (editingLevel) {
        await updateMemberLevel(editingLevel.id, {
          name: formData.name.trim(),
          discount: formData.discount,
          remark: formData.remark.trim() || undefined,
        });
      } else {
        await createMemberLevel({
          name: formData.name.trim(),
          discount: formData.discount,
          sortOrder: levels.length,
          remark: formData.remark.trim() || undefined,
        });
      }
      closeModal();
      loadLevels();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      alert(`操作失败：${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (level: MemberLevel) => {
    if (level.memberCount > 0) {
      alert(`该等级下有 ${level.memberCount} 位关联会员，无法删除。\n请先将会员迁移到其他等级。`);
      return;
    }
    if (!confirm(`确定要删除等级「${level.name}」吗？`)) return;

    setDeletingId(level.id);
    try {
      await deleteMemberLevel(level.id);
      loadLevels();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      alert(`删除失败：${message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // --- Drag and sort ---
  const handleDragStart = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIndex(index);
    dragNode.current = e.currentTarget;
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);

    const updated = [...levels];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setLevels(updated);
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    setDragIndex(null);
    setDragOverIndex(null);

    // Save sort order
    setSortSaving(true);
    try {
      const items = levels.map((level, index) => ({
        id: level.id,
        sortOrder: index,
      }));
      await batchSortMemberLevels(items);
    } catch (error) {
      console.error('Failed to save sort order:', error);
      loadLevels();
    } finally {
      setSortSaving(false);
    }
  };

  const formatDiscount = (discount: number): string => {
    if (discount >= 1.0) return '无折扣';
    return `${(discount * 10).toFixed(1)}折`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">会员等级管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理会员等级、折扣比例和排序。拖拽行可调整顺序，排序第一的等级为新会员默认等级。
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增等级
        </button>
      </div>

      {sortSaving && (
        <div className="text-sm text-muted-foreground animate-pulse">
          正在保存排序...
        </div>
      )}

      {/* Levels list with drag support */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : levels.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-2 w-10"></th>
                  <th className="text-left py-3 px-4 font-medium">等级名称</th>
                  <th className="text-left py-3 px-4 font-medium">折扣</th>
                  <th className="text-left py-3 px-4 font-medium">关联会员</th>
                  <th className="text-left py-3 px-4 font-medium">备注</th>
                  <th className="text-left py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level, index) => (
                  <tr
                    key={level.id}
                    className={`border-b hover:bg-accent/50 transition-colors ${
                      dragOverIndex === index ? 'border-t-2 border-t-primary' : ''
                    } ${index === 0 ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-3 px-2">
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(index, e)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent inline-flex"
                        title="拖拽排序"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{level.name}</span>
                        {index === 0 && (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary font-medium">
                            默认
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={level.discount < 1.0 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-muted-foreground'}>
                        {formatDiscount(Number(level.discount))}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{level.memberCount}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {level.remark || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(level)}
                          className="p-1.5 rounded-md hover:bg-accent text-primary"
                          title="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(level)}
                          disabled={deletingId === level.id}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            暂无会员等级，点击上方按钮创建第一个等级
          </div>
        )}
      </div>

      {/* Hint about default level */}
      {levels.length > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-xs">默认</span>
          标记表示新会员自动关联该等级。拖拽行调整顺序，排序第一的等级为默认等级。
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingLevel ? '编辑会员等级' : '新增会员等级'}
              </h2>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">等级名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：普通会员、银卡、金卡"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">折扣（1.00 = 无折扣，0.80 = 八折）</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: parseFloat(e.target.value) })
                    }
                    className="flex-1"
                  />
                  <span className="w-20 text-right font-medium tabular-nums">
                    {formData.discount >= 1.0
                      ? '无折扣'
                      : `${(formData.discount * 10).toFixed(1)}折`}
                  </span>
                </div>
                <input
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: parseFloat(e.target.value) })
                  }
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">备注</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="选填，如：消费满500自动升级"
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 py-2 px-4 rounded-md border border-input hover:bg-accent transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
