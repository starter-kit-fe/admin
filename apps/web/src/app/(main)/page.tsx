'use client';

import HealthStatusPanel from '@/app/(main)/components/health-status';
import HeroSection from '@/app/(main)/components/hero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/stores';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Activity,
  Layers,
  Palette,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef } from 'react';

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

type ActionLink = {
  label: string;
  href: string;
  variant: 'default' | 'outline';
  target?: '_blank';
  rel?: 'noreferrer';
};

type ResolvedLink = {
  href: string;
  target?: '_blank';
  rel?: 'noreferrer';
};

export default function Page() {
  const containerRef = useRef<HTMLElement | null>(null);
  const { user: isAuthenticated } = useAuthStore();
  const primaryCta = useMemo<ActionLink>(
    () =>
      isAuthenticated
        ? {
            label: '进入 Dashboard',
            href: '/dashboard',
            variant: 'default',
          }
        : {
            label: '登录账户',
            href: '/login',
            variant: 'default',
          },
    [isAuthenticated],
  );

  const secondaryCta = useMemo<ActionLink>(
    () =>
      isAuthenticated
        ? {
            label: '查看系统日志',
            href: '/dashboard/system/log',
            variant: 'outline',
          }
        : {
            label: '了解项目',
            href: 'https://github.com/starter-kit-fe/admin',
            variant: 'outline',
            target: '_blank',
            rel: 'noreferrer',
          },
    [isAuthenticated],
  );

  const resolveLinkProps = useCallback(
    (href: string): ResolvedLink => {
      if (href.startsWith('http')) {
        return { href, target: '_blank', rel: 'noreferrer' };
      }
      if (!isAuthenticated) {
        return { href: '/login' };
      }
      return { href };
    },
    [isAuthenticated],
  );

  const {
    label: primaryLabel,
    href: primaryHref,
    variant: primaryVariant,
    target: primaryTarget,
    rel: primaryRel,
  } = primaryCta;

  const {
    label: secondaryLabel,
    href: secondaryHref,
    variant: secondaryVariant,
    target: secondaryTarget,
    rel: secondaryRel,
  } = secondaryCta;

  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof window === 'undefined') {
      return;
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceMotion) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const sectionTriggers: ScrollTrigger[] = [];
    const parallaxTriggers: ScrollTrigger[] = [];
    const sectionTimelines: gsap.core.Timeline[] = [];

    const ctx = gsap.context(() => {

      const sections = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll('[data-animate-section]'),
      );

      sections.forEach((section, index) => {
        const introTargets = gsap.utils.toArray<HTMLElement>(
          section.querySelectorAll('[data-animate="intro"]'),
        );
        const cardTargets = gsap.utils.toArray<HTMLElement>(
          section.querySelectorAll('[data-animate="card"]'),
        );
        const highlightTargets = gsap.utils.toArray<HTMLElement>(
          section.querySelectorAll('[data-animate="highlight"]'),
        );

        if (
          introTargets.length === 0 &&
          cardTargets.length === 0 &&
          highlightTargets.length === 0
        ) {
          return;
        }

        const sectionTimeline = gsap.timeline({
          defaults: { ease: 'power2.out', duration: 0.9 },
        });

        if (introTargets.length) {
          sectionTimeline.fromTo(
            introTargets,
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: { each: 0.08, from: 'start' },
            },
            0,
          );
        }

        if (cardTargets.length) {
          const cardPosition = introTargets.length ? '-=0.25' : 0;
          sectionTimeline.fromTo(
            cardTargets,
            { y: 48, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: { each: 0.14, from: 'start' },
            },
            cardPosition,
          );
        }

        if (highlightTargets.length) {
          sectionTimeline.fromTo(
            highlightTargets,
            { y: 18, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: { each: 0.06, from: 'center' },
            },
            '-=0.25',
          );
        }

        sectionTimelines.push(sectionTimeline);

        sectionTriggers.push(
          ScrollTrigger.create({
            trigger: section,
            animation: sectionTimeline,
            start: 'top 78%',
            once: true,
            id: `section-${index}`,
          }),
        );
      });

      const parallaxElements = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll('[data-parallax]'),
      );

      parallaxElements.forEach((element, index) => {
        const parallaxTimeline = gsap.timeline();
        parallaxTimeline.fromTo(
          element,
          { yPercent: -6 },
          { yPercent: 6, ease: 'none' },
        );
        sectionTimelines.push(parallaxTimeline);

        parallaxTriggers.push(
          ScrollTrigger.create({
            trigger: element,
            animation: parallaxTimeline,
            start: 'top 90%',
            once: true,
            id: `parallax-${index}`,
          }),
        );
      });

    }, root);

    return () => {
      sectionTimelines.forEach((timeline) => timeline.kill());
      sectionTriggers.forEach((trigger) => trigger.kill());
      parallaxTriggers.forEach((trigger) => trigger.kill());
      ctx.revert();
    };
  }, []);

  return (
    <>
      <HeroSection />
      <main ref={containerRef} className="space-y-20 pb-20">
        <section
          id="features"
          className="mx-auto  px-6 pt-16 md:px-10 lg:px-12 container"
          data-animate-section
        >
          <div className="flex flex-col gap-4">
            <Badge
              variant="outline"
              className="w-fit border-dashed"
              data-animate="intro"
            >
              核心特性
            </Badge>
            <h2
              className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              data-animate="intro"
            >
              从界面到数据，一条龙打造现代化管理后台
            </h2>
            <p
              className="max-w-3xl text-sm text-muted-foreground sm:text-base"
              data-animate="intro"
            >
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
                  data-animate="card"
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
                        <li
                          key={item}
                          className="flex items-center gap-2"
                          data-animate="highlight"
                        >
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

        <section
          id="themes"
          className="mx-auto  px-6 md:px-10 lg:px-12 container"
          data-animate-section
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
            <div className="space-y-4">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary"
                data-animate="intro"
              >
                多主题模式
              </Badge>
              <h2
                className="text-2xl font-semibold sm:text-3xl"
                data-animate="intro"
              >
                一套设计语言，三种主题体验
              </h2>
              <p
                className="max-w-2xl text-sm text-muted-foreground sm:text-base"
                data-animate="intro"
              >
                默认跟随系统偏好，同时支持手动切换亮色与暗色主题。ThemeToggle
                组件与 next-themes 深度集成，带来顺滑的切换动效。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {themeCards.map((theme) => (
                <Card
                  key={theme.name}
                  className="overflow-hidden border-border/60 bg-background/70 backdrop-blur"
                  data-animate="card"
                >
                  <div
                    className={`h-24 w-full bg-gradient-to-br ${theme.accent}`}
                    data-parallax
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
          className="mx-auto  px-6 md:px-10 lg:px-12 container"
          data-animate-section
        >
          <div className="flex flex-col gap-4">
            <Badge
              variant="outline"
              className="w-fit border-dotted"
              data-animate="intro"
            >
              资源 & 工具
            </Badge>
            <h2
              className="text-2xl font-semibold sm:text-3xl"
              data-animate="intro"
            >
              配套资源加速你的交付
            </h2>
            <p
              className="max-w-3xl text-sm text-muted-foreground sm:text-base"
              data-animate="intro"
            >
              完整的后端 API、系统日志、Swagger 文档与 Turborepo
              架构支撑，让团队协作更顺畅。
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resourceCards.map((resource) => {
              const Icon = resource.icon;
              const linkProps = resolveLinkProps(resource.href);
              return (
                <Card
                  key={resource.title}
                  className="border-border/60 bg-background/70 backdrop-blur transition hover:border-primary/60 hover:shadow-md"
                  data-animate="card"
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
                        href={linkProps.href}
                        target={linkProps.target}
                        rel={linkProps.rel}
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
            <div data-animate="card">
              <HealthStatusPanel />
            </div>
            <div
              className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center backdrop-blur"
              data-animate="card"
            >
              <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
                已搭建完备的前后端体系，下一步就是交付你的业务
              </h3>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                使用 React Query + GSAP + Next.js
                的组合，打造动态、顺滑并可扩展的管理后台。
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button size="lg" asChild variant={primaryVariant}>
                  <Link
                    href={primaryHref}
                    target={primaryTarget}
                    rel={primaryRel}
                  >
                    {primaryLabel}
                  </Link>
                </Button>
                <Button size="lg" asChild variant={secondaryVariant}>
                  <Link
                    href={secondaryHref}
                    target={secondaryTarget}
                    rel={secondaryRel}
                  >
                    {secondaryLabel}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
