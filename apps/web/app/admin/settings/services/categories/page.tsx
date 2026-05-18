"use client";

import { useState, useEffect } from "react";
import {
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  reorderServiceCategories,
  type ServiceCategory,
} from "@/lib/api/service";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getServiceCategories();
      setCategories(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCategory = await createServiceCategory({
        name: newCategoryName.trim(),
        sortOrder: categories.length,
      });
      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await updateServiceCategory(id, { name: editingName.trim() });
      setCategories(
        categories.map((cat) =>
          cat.id === id ? { ...cat, name: editingName.trim() } : cat,
        ),
      );
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此分类吗？该分类下的服务项目将需要重新指定分类。"))
      return;
    try {
      await deleteServiceCategory(id);
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const startEdit = (category: ServiceCategory) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = categories.findIndex((c) => c.id === draggedId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);

    const reorderedIds = newCategories.map((c) => c.id);
    try {
      await reorderServiceCategories(reorderedIds);
      setCategories(
        newCategories.map((cat, index) => ({ ...cat, sortOrder: index })),
      );
    } catch (error) {
      console.error("Failed to reorder categories:", error);
    }

    setDraggedId(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">服务分类</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理服务项目分类，支持拖拽排序
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增分类
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          加载中...
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>暂无分类</p>
          <button
            type="button"
            onClick={() => setShowCreateDialog(true)}
            className="mt-4 text-primary hover:underline"
          >
            创建第一个分类
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, category.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category.id)}
              className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors group"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              <span className="text-sm text-muted-foreground w-6">
                #{category.sortOrder + 1}
              </span>

              {editingId === category.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleEdit(category.id)
                    }
                    className="flex-1 px-3 py-2 border rounded-md"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleEdit(category.id)}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 font-medium">{category.name}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="p-2 hover:bg-accent rounded-md"
                      title="编辑"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category.id)}
                      className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-md"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">新增服务分类</h2>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="分类名称"
              className="w-full px-4 py-2 border rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewCategoryName("");
                }}
                className="px-4 py-2 border rounded-md"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
