import { z } from 'zod';

export type PostStatus = '0' | '1';

export interface Post {
  postId: number;
  postCode: string;
  postName: string;
  postSort: number;
  status: PostStatus;
  remark?: string | null;
}

export interface PostListResponse {
  items: Post[];
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

export const buildPostFormSchema = (t: (path: string) => string) =>
  z.object({
    postCode: z
      .string()
      .trim()
      .min(1, t('validation.postCode.required'))
      .max(50, t('validation.postCode.max')),
    postName: z
      .string()
      .trim()
      .min(1, t('validation.postName.required'))
      .max(50, t('validation.postName.max')),
    status: z.enum(['0', '1']),
    remark: z.string().trim().max(255, t('validation.remark.max')),
  });

export interface CreatePostPayload {
  postCode: string;
  postName: string;
  postSort: number;
  status: PostStatus;
  remark?: string | null;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;
