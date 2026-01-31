export type PostStatus = '0' | '1';

export interface Post {
  id: number;
  postCode: string;
  postName: string;
  postSort: number;
  status: PostStatus;
  remark?: string | null;
}

export interface PostListResponse {
  list: Post[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface PostFormValues {
  postCode: string;
  postName: string;
  status: PostStatus;
  remark: string;
}

export interface CreatePostPayload {
  postCode: string;
  postName: string;
  postSort: number;
  status: PostStatus;
  remark?: string | null;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;
