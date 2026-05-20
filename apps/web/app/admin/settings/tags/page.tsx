"use client";

import { useState, useEffect } from "react";
import {
  Folder,
  Tag as TagIcon,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  getTagGroups,
  createTagGroup,
  updateTagGroup,
  deleteTagGroup,
  createTag,
  updateTag,
  deleteTag,
  type TagGroup,
  type Tag,
} from '@/lib/api/tags';

export default function TagsPage() {
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TagGroup | null>(null);
  const [editingTag, setEditingTag] = useState<{
    tag: Tag;
    groupId: string;
  } | null>(null);
  const [newTagGroupId, setNewTagGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadTagGroups();
  }, []);

  const loadTagGroups = async () => {
    setLoading(true);
    try {
      const groups = await getTagGroups();
      setTagGroups(groups);
      setExpandedGroups(new Set(groups.slice(0, 3).map((g) => g.id)));
    } catch (error) {
      console.error("Failed to load tag groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowGroupDialog(true);
  };

  const handleEditGroup = (group: TagGroup) => {
    setEditingGroup(group);
    setShowGroupDialog(true);
  };

  const handleSaveGroup = async (name: string) => {
    try {
      if (editingGroup) {
        await updateTagGroup(editingGroup.id, { name });
      } else {
        await createTagGroup({ name });
      }
      setShowGroupDialog(false);
      loadTagGroups();
    } catch (error) {
      alert(error instanceof Error ? error.message : "操作失败");
    }
  };

  const handleDeleteGroup = async (group: TagGroup) => {
    if (!confirm(`确定要删除标签组"${group.name}"吗？`)) return;

    try {
      await deleteTagGroup(group.id);
      loadTagGroups();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  const handleCreateTag = (groupId: string) => {
    setEditingTag(null);
    setNewTagGroupId(groupId);
    setShowTagDialog(true);
  };

  const handleEditTag = (tag: Tag, groupId: string) => {
    setEditingTag({ tag, groupId });
    setShowTagDialog(true);
  };

  const handleSaveTag = async (name: string) => {
    try {
      if (editingTag) {
        await updateTag(editingTag.tag.id, { name });
      } else if (newTagGroupId) {
        await createTag(newTagGroupId, { name });
      }
      setShowTagDialog(false);
      setNewTagGroupId(null);
      loadTagGroups();
    } catch (error) {
      alert(error instanceof Error ? error.message : "操作失败");
    }
  };

  const handleDeleteTag = async (tag: Tag, groupId: string) => {
    if (!confirm(`确定要删除标签"${tag.name}"吗？`)) return;

    try {
      await deleteTag(tag.id);
      loadTagGroups();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">标签管理</h1>
        <button
          type="button"
          onClick={handleCreateGroup}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新建标签组
        </button>
      </div>

      <div className="text-sm text-muted-foreground">
        标签可以用来分类和标记会员，便于识别会员特征和偏好。
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : tagGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <TagIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">暂无标签组</p>
          <button
            type="button"
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            创建第一个标签组
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tagGroups.map((group) => (
            <div
              key={group.id}
              className="bg-card border rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(group.id);
                    }}
                    className="p-1 hover:bg-accent rounded"
                  >
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="font-medium">{group.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({group.tags?.length || 0} 个标签)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGroup(group);
                    }}
                    className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group);
                    }}
                    className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-destructive"
                    disabled={!group.tags || group.tags.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedGroups.has(group.id) && (
                <div className="border-t bg-muted/20">
                  {group.tags && group.tags.length > 0 ? (
                    <div className="p-4 space-y-2">
                      {group.tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-3 bg-background rounded-md border"
                        >
                          <div className="flex items-center gap-2">
                            <TagIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{tag.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditTag(tag, group.id)}
                              className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTag(tag, group.id)}
                              className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      暂无标签
                    </div>
                  )}

                  <div className="px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => handleCreateTag(group.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      添加标签
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Group Dialog */}
      {showGroupDialog && (
        <GroupDialog
          group={editingGroup}
          onClose={() => setShowGroupDialog(false)}
          onSave={handleSaveGroup}
        />
      )}

      {/* Tag Dialog */}
      {showTagDialog && (
        <TagDialog
          tag={editingTag?.tag || null}
          onClose={() => {
            setShowTagDialog(false);
            setNewTagGroupId(null);
          }}
          onSave={handleSaveTag}
        />
      )}
    </div>
  );
}

interface GroupDialogProps {
  group: TagGroup | null;
  onClose: () => void;
  onSave: (name: string) => void;
}

function GroupDialog({ group, onClose, onSave }: GroupDialogProps) {
  const [name, setName] = useState(group?.name || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("请输入标签组名称");
      return;
    }
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">
            {group ? "编辑标签组" : "新建标签组"}
          </h2>
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
              标签组名称 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：客户偏好"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
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
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TagDialogProps {
  tag: Tag | null;
  onClose: () => void;
  onSave: (name: string) => void;
}

function TagDialog({ tag, onClose, onSave }: TagDialogProps) {
  const [name, setName] = useState(tag?.name || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("请输入标签名称");
      return;
    }
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">{tag ? "编辑标签" : "新建标签"}</h2>
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
              标签名称 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：喜欢短发"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
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
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
