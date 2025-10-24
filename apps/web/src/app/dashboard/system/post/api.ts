import { get } from '@/lib/request';

import type { Post } from './type';

export interface PostListParams {
  status?: string;
  postName?: string;
  postCode?: string;
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
  return Object.keys(query).length > 0 ? query : undefined;
}

export function listPosts(params: PostListParams = {}) {
  return get<Post[]>('/v1/system/posts', buildQuery(params));
}
