import { del, get, post as postRequest, put } from '@/lib/request';

import type {
  CreatePostPayload,
  PostListResponse,
  UpdatePostPayload,
} from './type';

export interface PostListParams {
  status?: string;
  postName?: string;
  postCode?: string;
  pageNum?: number;
  pageSize?: number;
}

function buildQuery(params: PostListParams = {}) {
  const query: Record<string, string> = {};
  if (params.status && params.status.trim()) {
    query.status = params.status.trim();
  }
  if (params.postName && params.postName.trim()) {
    query.postName = params.postName.trim();
  }
  if (params.postCode && params.postCode.trim()) {
    query.postCode = params.postCode.trim();
  }
  if (typeof params.pageNum === 'number') {
    query.pageNum = String(params.pageNum);
  }
  if (typeof params.pageSize === 'number') {
    query.pageSize = String(params.pageSize);
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

export function listPosts(params: PostListParams = {}) {
  return get<PostListResponse>('/v1/system/posts', buildQuery(params));
}

export function createPost(payload: CreatePostPayload) {
  return postRequest<Post>('/v1/system/posts', payload);
}

export function updatePost(postId: number, payload: UpdatePostPayload) {
  return put<Post>(`/v1/system/posts/${postId}`, payload);
}

export function removePost(postId: number) {
  return del<void>(`/v1/system/posts/${postId}`);
}
