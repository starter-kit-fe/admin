import type { Metadata } from 'next';
import Link from 'next/link';

import pkg from '../../../../package.json';

const siteName =
  pkg.seo?.title?.split('—')[0]?.trim() ?? pkg.name ?? 'Admin Template';
const lastUpdated = '2024 年 11 月 20 日';

type CookieRow = {
  name: string;
  category: '必要' | '偏好' | '可选';
  storage: string;
  duration: string;
  purpose: string;
};

const cookieMatrix: CookieRow[] = [
  {
    name: 'access_token',
    category: '必要',
    storage: 'HTTPOnly Cookie（由 Go API 设置）',
    duration: '会话期或最长 2 小时',
    purpose:
      '保存你的登录状态，让仪表盘与 API 请求能够安全识别账号；关闭浏览器或会话超时后会被清除。',
  },
  {
    name: 'refresh_token',
    category: '必要',
    storage: 'HTTPOnly Cookie（由 Go API 设置）',
    duration: '最长 7 天',
    purpose:
      '在访问令牌过期时静默刷新，避免频繁重新登录；我们同样通过 HTTPS 传输并限制仅后端可访问。',
  },
  {
    name: 'sidebar_state',
    category: '偏好',
    storage: '普通 Cookie',
    duration: '7 天',
    purpose:
      '记住你在 Dashboard 内侧边栏的展开/折叠状态，提升再次访问时的界面一致性。',
  },
  {
    name: 'admin_cookie_consent',
    category: '必要',
    storage: 'Cookie + localStorage',
    duration: '365 天',
    purpose:
      '记录你在页面底部横幅中的隐私偏好，以便我们尊重你的同意或拒绝。当你改变选择时会立即更新。',
  },
];

const optionalPractices = [
  '用于衡量新组件或动效是否提升可用性，我们仅会收集聚合指标（如停留时长、加载耗时）且在获得同意后才会写入浏览器。',
  '我们可能暂时启用错误监控脚本，以捕获匿名的控制台报错堆栈。该数据仅用于排查问题，不会关联个人身份。',
  '若你拒绝可选 Cookie，上述脚本会保持禁用状态，同时我们不会创建任何新的第三方追踪标识。',
];

export const metadata: Metadata = {
  title: `Cookie 政策 | ${siteName}`,
  description: `了解 ${siteName} 如何使用 Cookie、localStorage 以及你的控制方式。`,
};

export function CookiesPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            最后更新：{lastUpdated}
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{siteName} Cookie 政策</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            本政策解释我们在 {siteName} 中如何使用 Cookie、localStorage 与类似技术，
            以及你可以如何管理它们。它是{' '}
            <Link
              href="/terms"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              服务条款
            </Link>{' '}
            与{' '}
            <Link
              href="/privacy"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              隐私政策
            </Link>{' '}
            的组成部分。
          </p>
        </header>

        <section className="mt-10 space-y-6 rounded-3xl border border-border/70 bg-card/40 p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">我们使用的 Cookie 类型</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              我们遵循“必要优先”的设计：仅在维持登录或记住界面设置时写入 Cookie。
              任何用于分析或实验的脚本都需要你通过横幅明确同意。
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="min-w-full divide-y divide-border/60 text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Cookie 名称</th>
                  <th className="px-4 py-3 font-medium">类别</th>
                  <th className="px-4 py-3 font-medium">存储方式</th>
                  <th className="px-4 py-3 font-medium">保留时间</th>
                  <th className="px-4 py-3 font-medium">用途</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 bg-background/80">
                {cookieMatrix.map((cookie) => (
                  <tr key={cookie.name} className="align-top">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {cookie.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cookie.category}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cookie.storage}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cookie.duration}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cookie.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border/70 bg-primary/5 p-6">
            <h2 className="text-xl font-semibold">可选 Cookie 的场景</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              仅当你在横幅中选择“全部接受”时，我们才会启用以下实践：
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {optionalPractices.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border/70 bg-muted/40 p-6">
            <h2 className="text-xl font-semibold">如何管理 Cookie</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">通过横幅：</span>
                点击登录或首页底部的 Cookie 横幅，可随时拒绝可选 Cookie 或重新接受。
              </li>
              <li>
                <span className="font-medium text-foreground">浏览器设置：</span>
                在浏览器的“隐私/安全”设置中清理 Cookie 或启用禁止第三方 Cookie。
              </li>
              <li>
                <span className="font-medium text-foreground">撤回同意：</span>
                若你已接受可选 Cookie，可直接清除 admin_cookie_consent 或通过横幅选择“拒绝”以立即停用相关脚本。
              </li>
              <li>
                <span className="font-medium text-foreground">联系我们：</span>
                仍有疑问？请发送邮件至
                <a
                  href="mailto:support@admin.com"
                  className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  support@admin.com
                </a>
                ，我们会协助你完成 Cookie 偏好管理。
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
