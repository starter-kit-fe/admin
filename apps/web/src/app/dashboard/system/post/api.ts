import { get } from '@/lib/request';

import type { Post } from './type';

export interface PostListParams {
  status?: string;
  postName?: string;
  postCode?: string;
}

export function listPosts(params: PostListParams = {}) {
  return get<Post[]>('/v1/system/posts', params);
}
