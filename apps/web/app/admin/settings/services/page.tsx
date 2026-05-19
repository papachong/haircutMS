"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getServiceCategories,
  getServiceItems,
  createServiceItem,
  updateServiceItem,
  toggleServiceItem,
  deleteServiceItem,
  reorderServiceItems,
  type ServiceCategory,
  type ServiceItem,
  type CreateServiceItemInput,
} from "@/lib/api/service";
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";

export default function ServiceItemsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "",
    image: "",
    categoryId: "",
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadItems();
  }, [selectedCategoryId]);

  const loadData = async () => {
    try {
      const cats = await getServiceCategories();
      setCategories(cats);
      if (cats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(cats[0].id);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadItems = async () => {
    if (!selectedCategoryId) return;
    setLoading(true);
    try {
      const data = await getServiceItems({ categoryId: selectedCategoryId });
      setItems(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (error) {
      console.error("Failed to load items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (
      !formData.name ||
      !formData.price ||
      !formData.duration ||
      !formData.categoryId
    )
      return;
    try {
      const newItem = await createServiceItem({
        categoryId: formData.categoryId,
        name: formData.name,
        price: Math.round(parseFloat(formData.price) * 100),
        duration: parseInt(formData.duration),
        image: formData.image || undefined,
        sortOrder: items.length,
      });
      setItems([...items, newItem]);
      setShowCreateDialog(false);
      setFormData({
        name: "",
        price: "",
        duration: "",
        image: "",
        categoryId: "",
      });
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name || !formData.price || !formData.duration)
      return;
    try {
      const updated = await updateServiceItem(editingId, {
        name: formData.name,
        price: Math.round(parseFloat(formData.price) * 100),
        duration: parseInt(formData.duration),
        image: formData.image || undefined,
      });
      setItems(items.map((item) => (item.id === editingId ? updated : item)));
      setEditingId(null);
      setFormData({
        name: "",
        price: "",
        duration: "",
        image: "",
        categoryId: "",
      });
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await toggleServiceItem(id);
      setItems(items.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此服务项目吗？")) return;
    try {
      await deleteServiceItem(id);
      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const startEdit = (item: ServiceItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      price: (item.price / 100).toFixed(2),
      duration: item.duration.toString(),
      image: item.image || "",
      categoryId: item.categoryId,
    });
    setShowCreateDialog(true);
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
    if (!draggedId || draggedId === targetId || !selectedCategoryId) return;

    const draggedIndex = items.findIndex((i) => i.id === draggedId);
    const targetIndex = items.findIndex((i) => i.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    const reorderedIds = newItems.map((i) => i.id);
    try {
      await reorderServiceItems(selectedCategoryId, reorderedIds);
      setItems(newItems.map((item, index) => ({ ...item, sortOrder: index })));
    } catch (error) {
      console.error("Failed to reorder items:", error);
    }

    setDraggedId(null);
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar - Categories */}
      <aside className="w-64 border-r bg-card shrink-0 hidden md:block">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">服务分类</h2>
        </div>
        <nav className="p-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md mb-1 transition-colors flex items-center justify-between ${
                selectedCategoryId === category.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              <span className="truncate">{category.name}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedCategoryId === category.id
                    ? "bg-primary-foreground/20"
                    : "bg-accent"
                }`}
              >
                {category._count?.items ?? 0}
              </span>
            </button>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              暂无分类，请先创建
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push("/admin/settings/services/categories")}
            className="w-full text-left px-3 py-2 mt-2 text-sm text-muted-foreground hover:text-primary"
          >
            + 管理分类
          </button>
        </nav>
      </aside>

      {/* Main Content - Items */}
      <main className="flex-1 p-4 md:p-6 min-w-0">
        {/* Mobile category selector */}
        <div className="flex gap-2 overflow-x-auto md:hidden mb-4 pb-1">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
                selectedCategoryId === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent hover:bg-accent/80"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {selectedCategory ? selectedCategory.name : "服务项目"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              管理该分类下的服务项目，支持拖拽排序
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "",
                price: "",
                duration: "",
                image: "",
                categoryId: selectedCategoryId || "",
              });
              setShowCreateDialog(true);
            }}
            disabled={!selectedCategoryId}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            新增项目
          </button>
        </div>

        {!selectedCategoryId ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>请选择或创建一个分类</p>
            <button
              type="button"
              onClick={() => router.push("/admin/settings/services/categories")}
              className="mt-4 text-primary hover:underline"
            >
              前往管理分类
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            加载中...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>该分类下暂无服务项目</p>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: "",
                  price: "",
                  duration: "",
                  image: "",
                  categoryId: selectedCategoryId,
                });
                setShowCreateDialog(true);
              }}
              className="mt-4 text-primary hover:underline"
            >
              创建第一个项目
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`flex items-center gap-4 p-4 bg-card border rounded-lg transition-colors group ${
                  !item.isActive ? "opacity-60" : "hover:border-primary/50"
                }`}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move shrink-0" />
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-md shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-md bg-accent flex items-center justify-center text-muted-foreground text-xs shrink-0">
                    暂无图
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>时长: {item.duration}分钟</span>
                    <span>价格: ¥{(item.price / 100).toFixed(2)}</span>
                    {!item.isActive && (
                      <span className="text-destructive">已下架</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={`p-2 rounded-md ${
                      item.isActive
                        ? "hover:bg-accent"
                        : "hover:bg-destructive/10 text-destructive"
                    }`}
                    title={item.isActive ? "下架" : "上架"}
                  >
                    {item.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="p-2 hover:bg-accent rounded-md"
                    title="编辑"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-md"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">
                {editingId ? "编辑服务项目" : "新增服务项目"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    项目名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-md"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      价格 (元)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      时长 (分钟)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    图片链接 (可选)
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingId(null);
                    setFormData({
                      name: "",
                      price: "",
                      duration: "",
                      image: "",
                      categoryId: "",
                    });
                  }}
                  className="px-4 py-2 border rounded-md"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={editingId ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                >
                  {editingId ? "保存" : "创建"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
