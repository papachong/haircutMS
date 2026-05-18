'use client';

import { useState, useEffect } from 'react';
import {
  getMemberLevels,
  createMemberLevel,
  updateMemberLevel,
  deleteMemberLevel,
  reorderMemberLevels,
  type MemberLevel,
  type CreateMemberLevelInput,
  type UpdateMemberLevelInput,
} from '@/lib/api/member-levels';
import { Plus, Edit, Trash2, GripVertical, Percent, Crown } from 'lucide-react';

export default function MemberLevelsPage() {
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateMemberLevelInput>({
    name: '',
    discount: 1.0,
    sortOrder: 0,
    remark: '',
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    loadLevels();
  }, []);

  async function loadLevels() {
    setLoading(true);
    try {
      const data = await getMemberLevels();
      setLevels(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (error) {
      console.error('Failed to load member levels:', error);
      alert('加载失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || formData.discount < 0.1 || formData.discount > 1.0) {
      alert('请填写完整信息，折扣率需在0.1-1.0之间');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateMemberLevel(editingId, formData);
      } else {
        await createMemberLevel({
          ...formData,
          sortOrder: levels.length,
        });
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', discount: 1.0, sortOrder: 0, remark: '' });
      loadLevels();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      alert(`${editingId ? '更新' : '创建'}失败: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除此会员等级吗？')) return;

    setLoading(true);
    try {
      await deleteMemberLevel(id);
      alert('删除成功');
      loadLevels();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      alert(`删除失败: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(level: MemberLevel) {
    setEditingId(level.id);
    setFormData({
      name: level.name,
      discount: level.discount,
      sortOrder: level.sortOrder,
      remark: level.remark || '',
    });
    setShowModal(true);
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = levels.findIndex((l) => l.id === draggedId);
    const targetIndex = levels.findIndex((l) => l.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLevels = [...levels];
    const [removed] = newLevels.splice(draggedIndex, 1);
    newLevels.splice(targetIndex, 0, removed);

    const reorderedIds = newLevels.map((l) => l.id);
    try {
      await reorderMemberLevels(reorderedIds);
      setLevels(newLevels.map((level, index) => ({ ...level, sortOrder: index })));
    } catch (error) {
      console.error('Failed to reorder:', error);
    }

    setDraggedId(null);
  }

  function getDiscountDisplay(discount: number): string {
    const percentage = Math.round(discount * 100);
    return `${percentage}%`;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">会员等级管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理会员等级和折扣率，支持拖拽排序
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', discount: 1.0, sortOrder: levels.length, remark: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          新增等级
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          加载中...
        </div>
      ) : levels.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
          <p>暂无会员等级</p>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', discount: 1.0, sortOrder: 0, remark: '' });
              setShowModal(true);
            }}
            className="mt-4 text-primary hover:underline"
          >
            创建第一个等级
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {levels.map((level, index) => (
            <div
              key={level.id}
              draggable
              onDragStart={(e) => handleDragStart(e, level.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, level.id)}
              className={`flex items-center gap-4 rounded-lg border bg-card p-4 transition-all group ${
                index === 0 ? 'ring-2 ring-primary/50' : 'hover:border-primary/50'
              }`}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              {index === 0 && <Crown className="h-5 w-5 text-primary" />}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{level.name}</h3>
                  {index === 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      默认等级
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">折扣率:</span>
                    <span className="font-medium">{getDiscountDisplay(level.discount)}</span>
                  </div>
                  {level.remark && (
                    <span className="text-muted-foreground">{level.remark}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(level)}
                  className="rounded-lg p-2 hover:bg-secondary"
                  title="编辑"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(level.id)}
                  className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                  title="删除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {editingId ? '编辑会员等级' : '新增会员等级'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">等级名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：金卡、银卡、普通会员"
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">折扣率</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.1"
                    max="1.0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 1.0 })}
                    className="w-24 rounded-lg border bg-card px-3 py-2 text-sm"
                    required
                  />
                  <span className="text-sm text-muted-foreground">
                    ({getDiscountDisplay(formData.discount)})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    1.0 = 无折扣, 0.88 = 8.8折
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">备注（可选）</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="添加等级说明..."
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setFormData({ name: '', discount: 1.0, sortOrder: 0, remark: '' });
                  }}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {editingId ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}