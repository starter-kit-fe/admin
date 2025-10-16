'use client';

import ThemeToggle from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import gsap from 'gsap';
import { ArrowRight, LayoutDashboard, LogIn, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import pkg from '../../package.json';

type StaticNavLink = {
  label: string;
  hash: string;
};

type RouteNavLink = {
  label: string;
  href: string;
};

type NavLink = StaticNavLink | RouteNavLink;

const NAV_LINKS: StaticNavLink[] = [
  { label: '特性', hash: 'features' },
  { label: '主题', hash: 'themes' },
  { label: '资源', hash: 'resources' },
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
];

export default function Header() {
  const pathname = usePathname();
  const heroRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const heroTitle = useMemo(() => {
    const [main, ...rest] = pkg.seo.title.split('—').map((item) => item.trim());
    return {
      main,
      secondary: rest.join(' — '),
    };
  }, []);

  const keywords = useMemo(() => pkg.seo.keywords.slice(0, 3), []);

  const [heroImage, setHeroImage] = useState<string>(HERO_IMAGES[0]);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = useMemo<NavLink[]>(() => {
    const base: NavLink[] = [...NAV_LINKS];
    base.push({
      label: user ? 'Dashboard' : '登录',
      href: user ? '/dashboard' : '/login',
    });
    return base;
  }, [user]);

  useEffect(() => {
    if (!heroRef.current) {
      return;
    }

    const context = gsap.context(() => {
      gsap.from('.hero-animate', {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
      });

      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { scale: 1.05, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: 'power2.out',
            delay: 0.15,
          },
        );
      }
    }, heroRef);

    return () => {
      context.revert();
    };
  }, []);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) {
      return;
    }
    const index = Math.floor(Math.random() * HERO_IMAGES.length);
    const chosen = HERO_IMAGES[index] ?? HERO_IMAGES[0];
    setHeroImage(chosen);
  }, []);

  const ctaHref = user ? '/dashboard' : '/login';

  return (
    <header
      ref={heroRef}
      className="relative isolate overflow-hidden border-b bg-background"
    >
      <div className="absolute inset-0 -z-10">
        <div
          ref={backdropRef}
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
          role="presentation"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/75 to-background" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 pb-16 pt-8 md:gap-16 md:px-10 lg:px-12">
        <nav className="hero-animate flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="group flex items-center gap-3 font-semibold text-lg"
            >
              <img src="/pwa-512x512.png" alt="" className="size-[30px]" />
              <span className="hidden text-base text-muted-foreground transition-colors group-hover:text-foreground sm:inline">
                {heroTitle.main}
              </span>
            </Link>
            <div className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex">
              {navLinks.map((link) => {
                const key = 'hash' in link ? link.hash : link.href;
                const href =
                  'hash' in link
                    ? { pathname: '/', hash: link.hash }
                    : link.href;
                return (
                  <Link
                    key={`${link.label}-${key}`}
                    href={href}
                    className={cn(
                      'rounded-full px-3 py-1 transition-colors hover:text-foreground',
                      pathname === '/' ? 'hover:bg-muted/60' : '',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Drawer
              open={isMobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
              direction="top"
            >
              <DrawerTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                  'md:hidden',
                )}
                aria-label="打开导航菜单"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开导航菜单</span>
              </DrawerTrigger>
              <DrawerContent className="flex h-full flex-col gap-6 px-4 pt-8 mb-0 pb-0 w-full">
                <DrawerHeader className="text-left">
                  <DrawerTitle className="flex items-center gap-3 text-lg">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                      VOH
                    </span>
                    {heroTitle.main}
                  </DrawerTitle>
                </DrawerHeader>
                <nav className="flex flex-col gap-3 text-sm font-medium text-foreground/90">
                  {navLinks.map((link) => {
                    const key = 'hash' in link ? link.hash : link.href;
                    const href =
                      'hash' in link
                        ? { pathname: '/', hash: link.hash }
                        : link.href;
                    return (
                      <DrawerClose asChild key={`mobile-${link.label}-${key}`}>
                        <Link
                          href={href}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-background/95 px-4 py-3 text-base transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <span>{link.label}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </DrawerClose>
                    );
                  })}
                </nav>
              </DrawerContent>
            </Drawer>
            <ThemeToggle />
            {user ? (
              <div className="hero-animate hidden items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur sm:flex">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.user.avatar}
                    alt={user.user.nickName}
                  />
                  <AvatarFallback>
                    {(user.user.nickName || user.user.userName || 'U').slice(
                      0,
                      1,
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {user.user.nickName || user.user.userName}
                </span>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center">
          <div className="flex flex-col gap-6 text-left">
            {heroTitle.secondary ? (
              <Badge
                variant="outline"
                className="hero-animate w-fit border-primary/40 bg-background/80 text-primary backdrop-blur"
              >
                {heroTitle.secondary}
              </Badge>
            ) : null}
            <h1 className="hero-animate text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {pkg.seo.og.title}
            </h1>
            <p className="hero-animate max-w-2xl text-base text-muted-foreground sm:text-lg">
              {pkg.seo.description}
            </p>
            <div className="hero-animate flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'group w-full justify-center sm:w-auto',
                )}
              >
                {user ? '立即体验' : '开始使用'}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'lg' }),
                  'w-full justify-center sm:w-auto',
                )}
              >
                了解特性
              </Link>
            </div>
            <div className="hero-animate flex flex-wrap gap-6 text-sm text-muted-foreground">
              {keywords.map((keyword) => (
                <div key={keyword} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{keyword}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="hero-animate max-lg:order-first border-primary/10 bg-background/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">自适应外观 · 即刻切换</CardTitle>
              <CardDescription>
                黑暗、亮色、跟随系统三种主题模式，在任何设备上都保持一致体验。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {['暗夜模式', '亮色模式', '系统同步'].map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="bg-muted/60 text-muted-foreground"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">
                  支持通过{' '}
                  <code className="font-mono text-primary">ThemeToggle</code>{' '}
                  组件一键切换，基于{' '}
                  <code className="font-mono text-primary">
                    @tanstack/react-query
                  </code>{' '}
                  与自定义请求库保持登录态。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </header>
  );
}
