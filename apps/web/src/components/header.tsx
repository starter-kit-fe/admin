'use client';

import ThemeToggle from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, LayoutDashboard, LogIn, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

function resolveBrand() {
  const title = pkg.seo?.title ?? 'Admin Template';
  return title.split('—')[0]?.trim() ?? title;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const brandName = useMemo(resolveBrand, []);

  const navLinks = useMemo<NavLink[]>(() => [...NAV_LINKS], []);

  useEffect(() => {
    const element = navRef.current;
    if (!element) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const show = () => {
      gsap.to(element, {
        backgroundColor: 'hsl(var(--background) / 0.82)',
        backdropFilter: 'blur(18px)',
        borderColor: 'hsl(var(--border) / 0.35)',
        boxShadow: '0 26px 48px -28px hsla(var(--foreground) / 0.18)',
        color: 'hsl(var(--foreground))',
        duration: 0.35,
        ease: 'power2.out',
      });
    };

    const hide = () => {
      gsap.to(element, {
        backgroundColor: 'hsl(var(--background) / 0)',
        backdropFilter: 'blur(0px)',
        borderColor: 'hsl(var(--border) / 0)',
        boxShadow: '0 0 0 0 hsla(var(--foreground) / 0)',
        duration: 0.35,
        ease: 'power2.out',
      });
    };

    const trigger = ScrollTrigger.create({
      start: 80,
      end: 99999,
      onEnter: show,
      onLeaveBack: hide,
    });

    return () => trigger.kill();
  }, []);

  const handleStaticNav = useCallback(
    (hash: string) => {
      if (pathname !== '/') {
        router.push(`/${hash ? `#${hash}` : ''}`);
        return;
      }

      const target = document.getElementById(hash);
      if (!target) {
        return;
      }

      const headerHeight = navRef.current?.offsetHeight ?? 72;
      const top =
        target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    },
    [pathname, router],
  );

  const renderNavLink = (link: NavLink, variant: 'desktop' | 'mobile') => {
    const key = 'hash' in link ? link.hash : link.href;
    const isStatic = 'hash' in link;

    if (isStatic) {
      if (variant === 'mobile') {
        return (
          <DrawerClose asChild key={`${variant}-${link.label}-${key}`}>
            <button
              type="button"
              onClick={() => handleStaticNav(link.hash)}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/95 px-4 py-3 text-base transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span>{link.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </DrawerClose>
        );
      }

      return (
        <button
          key={`${variant}-${link.label}-${key}`}
          type="button"
          onClick={() => handleStaticNav(link.hash)}
          className="rounded-full px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          {link.label}
        </button>
      );
    }

    if (variant === 'mobile') {
      return (
        <DrawerClose asChild key={`${variant}-${link.label}-${key}`}>
          <Link
            href={link.href}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/95 px-4 py-3 text-base transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span>{link.label}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </DrawerClose>
      );
    }

    return (
      <Link
        key={`${variant}-${link.label}-${key}`}
        href={link.href}
        className="rounded-full px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      >
        {link.label}
      </Link>
    );
  };

  const ctaHref = isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? '进入控制台' : '登录账户';
  const CtaIcon = isAuthenticated ? LayoutDashboard : LogIn;

  return (
    <header
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-transparent transition-[background-color,backdrop-filter,border-color,box-shadow]"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="group flex items-center gap-3 text-base font-semibold text-foreground"
        >
          <img src="/pwa-512x512.png" alt="" className="size-[28px]" />
          <span className="hidden text-sm text-muted-foreground transition-colors group-hover:text-foreground sm:inline">
            {brandName}
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => renderNavLink(link, 'desktop'))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={ctaHref}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'inline-flex items-center gap-2 px-4'
            )}
          >
            <CtaIcon className="h-4 w-4" />
            {ctaLabel}
          </Link>
          <ThemeToggle className="hidden md:inline-flex" />
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
            <DrawerContent className="flex max-h-[90vh] flex-col gap-6 px-4 pb-6 pt-[calc(env(safe-area-inset-top,0)+1.5rem)]">
              <DrawerHeader className="text-left">
                <DrawerTitle className="flex items-center gap-3 text-lg">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                    VOH
                  </span>
                  {brandName}
                </DrawerTitle>
              </DrawerHeader>
              <nav className="grid gap-3 text-sm font-medium text-foreground/90">
                {navLinks.map((link) => renderNavLink(link, 'mobile'))}
              </nav>
              <div className="grid gap-3">
                <Link
                  href={ctaHref}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'inline-flex items-center justify-center gap-2'
                  )}
                >
                  <CtaIcon className="h-4 w-4" />
                  {ctaLabel}
                </Link>
                <ThemeToggle className="justify-center" />
              </div>
            </DrawerContent>
          </Drawer>
          <ThemeToggle className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
