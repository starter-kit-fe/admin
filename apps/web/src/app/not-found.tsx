import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">页面未找到</h2>
      <p className="mt-4 text-gray-600">抱歉，您访问的页面不存在。</p>
      <Link
        href="/"
        className="mt-6 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        返回首页
      </Link>
    </div>
  );
}
