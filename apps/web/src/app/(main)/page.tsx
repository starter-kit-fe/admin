import HealthStatusPanel from '@/components/health-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  Layers,
  Palette,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import pkg from '../../../package.json';

const featureCards = [
  {
    title: '现代化界面体系',
    description:
      '基于 shadcn/ui 与 Tailwind 的设计体系，提供高度一致、可定制的组件库。',
    icon: Layers,
    highlights: pkg.seo.keywords,
  },
  {
    title: '智能数据层',
    description:
      '@tanstack/react-query 与自定义 HttpClient 协作，提供缓存、重试与登录态管理。',
    icon: Activity,
    highlights: ['数据缓存', '鉴权守护', '请求超时控制'],
  },
  {
    title: '企业级安全守护',
    description: '内置完整的权限、角色、日志体系，配合后端 Go 服务保障安全。',
    icon: ShieldCheck,
    highlights: ['权限校验', '登录日志', '可观测性'],
  },
] as const;

const themeCards = [
  {
    name: '亮色主题',
    description: '干净明亮的工作台体验，适合日常办公与展示场景。',
    accent: 'from-white via-slate-100 to-white',
    badge: '亮色',
  },
  {
    name: '暗色主题',
    description: '柔和对比与护眼配色，让夜间使用更加舒适。',
    accent: 'from-slate-950 via-slate-900 to-slate-950',
    badge: '暗夜',
  },
  {
    name: '跟随系统',
    description: '自动识别系统配色偏好，在不同设备间保持体验一致。',
    accent: 'from-slate-100 via-slate-900/40 to-slate-900',
    badge: '系统',
  },
] as const;

const resourceCards = [
  {
    title: 'API 文档',
    description: 'Swagger 集成，快速了解后端接口定义与示例。',
    href: '/dashboard/tool/swagger',
    icon: Zap,
  },
  {
    title: '系统日志',
    description: '实时追踪登录与操作日志，助力排查定位。',
    href: '/dashboard/system/log',
    icon: Sparkles,
  },
  {
    title: '项目结构',
    description: 'Apps + Packages 的 Turborepo 架构，支持多人协作与复用。',
    href: 'https://github.com/starter-kit-fe/admin',
    icon: Palette,
  },
] as const;

export default function Page() {
  return (
    <main className="space-y-20 pb-20">
      <section
        id="features"
        className="mx-auto max-w-6xl px-6 pt-16 md:px-10 lg:px-12"
      >
        <div className="flex flex-col gap-4">
          <Badge variant="outline" className="w-fit border-dashed">
            核心特性
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            从界面到数据，一条龙打造现代化管理后台
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            {pkg.seo.description}
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="border-border/60 bg-background/70 backdrop-blur transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
              >
                <CardHeader className="gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground/90">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {feature.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="themes" className="mx-auto max-w-6xl px-6 md:px-10 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              多主题模式
            </Badge>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              一套设计语言，三种主题体验
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              默认跟随系统偏好，同时支持手动切换亮色与暗色主题。ThemeToggle
              组件与 next-themes 深度集成，带来顺滑的切换动效。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {themeCards.map((theme) => (
              <Card
                key={theme.name}
                className="overflow-hidden border-border/60 bg-background/70 backdrop-blur"
              >
                <div
                  className={`h-24 w-full bg-gradient-to-br ${theme.accent}`}
                />
                <CardHeader className="gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge
                      variant="outline"
                      className="border-dashed border-primary/40 text-xs uppercase tracking-widest text-primary"
                    >
                      {theme.badge}
                    </Badge>
                    {theme.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/90">
                    {theme.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="resources"
        className="mx-auto max-w-6xl px-6 md:px-10 lg:px-12"
      >
        <div className="flex flex-col gap-4">
          <Badge variant="outline" className="w-fit border-dotted">
            资源 & 工具
          </Badge>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            配套资源加速你的交付
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            完整的后端 API、系统日志、Swagger 文档与 Turborepo
            架构支撑，让团队协作更顺畅。
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resourceCards.map((resource) => {
            const Icon = resource.icon;
            return (
              <Card
                key={resource.title}
                className="border-border/60 bg-background/70 backdrop-blur transition hover:border-primary/60 hover:shadow-md"
              >
                <CardHeader className="gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-fit px-0 text-sm text-primary hover:text-primary/80"
                  >
                    <Link
                      href={resource.href}
                      target={
                        resource.href.startsWith('http') ? '_blank' : undefined
                      }
                      rel={
                        resource.href.startsWith('http')
                          ? 'noreferrer'
                          : undefined
                      }
                    >
                      查看详情 →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-stretch">
          <HealthStatusPanel />
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center backdrop-blur">
            <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
              已搭建完备的前后端体系，下一步就是交付你的业务
            </h3>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              使用 React Query + GSAP + Next.js
              的组合，打造动态、顺滑并可扩展的管理后台。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/dashboard">进入 Dashboard</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">登录账户</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
