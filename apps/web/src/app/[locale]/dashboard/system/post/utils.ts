import type {
  CreatePostPayload,
  Post,
  PostFormValues,
  UpdatePostPayload,
} from './type';

export function toFormValues(post: Post): PostFormValues {
  return {
    postCode: post.postCode ?? '',
    postName: post.postName ?? '',
    status: post.status ?? '0',
    remark: post.remark ?? '',
  };
}

function normalizeOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function toCreatePayload(
  values: PostFormValues,
  sort: number,
): CreatePostPayload {
  return {
    postCode: values.postCode.trim(),
    postName: values.postName.trim(),
    postSort: Number.isNaN(sort) ? 0 : sort,
    status: values.status,
    remark: normalizeOptional(values.remark) ?? null,
  };
}

export const toUpdatePayload = (
  values: PostFormValues,
  sort: number,
): UpdatePostPayload => toCreatePayload(values, sort);

export function computeNextSort(posts: Post[], total: number): number {
  let max = total;
  posts.forEach((item) => {
    if (item.postSort != null && item.postSort > max) {
      max = item.postSort;
    }
  });
  return max + 1;
}

export function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}
