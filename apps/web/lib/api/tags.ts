import { apiFetch } from "./client";

export interface TagGroup {
  id: string;
  shopId: string;
  name: string;
  createdAt: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  groupId: string;
  name: string;
  createdAt: string;
  group?: {
    id: string;
    name: string;
  };
}

export interface MemberTag {
  id: string;
  name: string;
  group: {
    id: string;
    name: string;
  };
  assignedAt: string;
}

export interface SystemAutoTags {
  memberId: string;
  tags: string[];
  criteria: {
    isNewMember: boolean;
    isDormant: boolean;
  };
}

export interface CreateTagGroupInput {
  name: string;
}

export interface UpdateTagGroupInput {
  name?: string;
}

export interface CreateTagInput {
  name: string;
}

export interface UpdateTagInput {
  name: string;
}

export interface SetMemberTagsInput {
  tagIds: string[];
}

// Tag Groups

export async function getTagGroups(): Promise<TagGroup[]> {
  const res = await apiFetch<{ code: number; data: TagGroup[] }>("/tag-groups");
  return res.data;
}

export async function getTagGroupById(id: string): Promise<TagGroup> {
  const res = await apiFetch<{ code: number; data: TagGroup }>(
    `/tag-groups/${id}`,
  );
  return res.data;
}

export async function createTagGroup(
  data: CreateTagGroupInput,
): Promise<TagGroup> {
  const res = await apiFetch<{ code: number; data: TagGroup }>("/tag-groups", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateTagGroup(
  id: string,
  data: UpdateTagGroupInput,
): Promise<TagGroup> {
  const res = await apiFetch<{ code: number; data: TagGroup }>(
    `/tag-groups/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

export async function deleteTagGroup(id: string): Promise<{ id: string }> {
  const res = await apiFetch<{ code: number; data: { id: string } }>(
    `/tag-groups/${id}`,
    {
      method: "DELETE",
    },
  );
  return res.data;
}

// Tags

export async function getTagById(id: string): Promise<Tag> {
  const res = await apiFetch<{ code: number; data: Tag }>(`/tags/${id}`);
  return res.data;
}

export async function createTag(
  groupId: string,
  data: CreateTagInput,
): Promise<Tag> {
  const res = await apiFetch<{ code: number; data: Tag }>(
    `/tag-groups/${groupId}/tags`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

export async function updateTag(
  id: string,
  data: UpdateTagInput,
): Promise<Tag> {
  const res = await apiFetch<{ code: number; data: Tag }>(`/tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteTag(id: string): Promise<{ id: string }> {
  const res = await apiFetch<{ code: number; data: { id: string } }>(
    `/tags/${id}`,
    {
      method: "DELETE",
    },
  );
  return res.data;
}

// Member Tags

export async function getMemberTags(memberId: string): Promise<MemberTag[]> {
  const res = await apiFetch<{ code: number; data: MemberTag[] }>(
    `/members/${memberId}/tags`,
  );
  return res.data;
}

export async function getSystemAutoTags(
  memberId: string,
): Promise<SystemAutoTags> {
  const res = await apiFetch<{ code: number; data: SystemAutoTags }>(
    `/members/${memberId}/tags/auto`,
  );
  return res.data;
}

export async function setMemberTags(
  memberId: string,
  data: SetMemberTagsInput,
): Promise<MemberTag[]> {
  const res = await apiFetch<{ code: number; data: MemberTag[] }>(
    `/members/${memberId}/tags`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

export async function addMemberTag(
  memberId: string,
  tagId: string,
): Promise<MemberTag[]> {
  const res = await apiFetch<{ code: number; data: MemberTag[] }>(
    `/members/${memberId}/tags/add`,
    {
      method: "POST",
      body: JSON.stringify({ tagId }),
    },
  );
  return res.data;
}

export async function removeMemberTag(
  memberId: string,
  tagId: string,
): Promise<MemberTag[]> {
  const res = await apiFetch<{ code: number; data: MemberTag[] }>(
    `/members/${memberId}/tags/remove`,
    {
      method: "POST",
      body: JSON.stringify({ tagId }),
    },
  );
  return res.data;
}
