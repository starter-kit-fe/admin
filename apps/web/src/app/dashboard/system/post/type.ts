export interface Post {
  postId: number;
  postCode: string;
  postName: string;
  postSort: number;
  status: '0' | '1';
  remark?: string | null;
}
