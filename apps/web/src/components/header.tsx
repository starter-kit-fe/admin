'use client';

import { LogoMark } from '@/components/logo-mark';
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
  const { isAuthenticated } = useAuthStore();

  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const brandName = useMemo(resolveBrand, []);

  const navLinks = useMemo<NavLink[]>(() => [...NAV_LINKS], []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 64);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

      const headerHeight = headerRef.current?.clientHeight ?? 72;
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
              <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-white/70" />
            </button>
          </DrawerClose>
        );
      }

      return (
        <button
          key={`${variant}-${link.label}-${key}`}
          type="button"
          onClick={() => handleStaticNav(link.hash)}
          className="rounded-full px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground dark:text-white/85 dark:hover:text-white"
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
            <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-white/70" />
          </Link>
        </DrawerClose>
      );
    }

    return (
      <Link
        key={`${variant}-${link.label}-${key}`}
        href={link.href}
        className="rounded-full px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground dark:text-white/85 dark:hover:text-white"
      >
        {link.label}
      </Link>
    );
  };

  const ctaHref = isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? '控制台' : '登录账户';
  const CtaIcon = isAuthenticated ? LayoutDashboard : LogIn;

  return (
    <header
      ref={headerRef}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow]',
        isScrolled
          ? 'backdrop-blur supports-[backdrop-filter]:bg-background/60'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto container flex h-16  items-center justify-between gap-4 px-4 text-foreground dark:text-white sm:px-6 lg:px-10">
        <Link
          href="/"
          className="group flex items-center gap-3 text-base font-semibold text-inherit"
        >
          <LogoMark
            className="size-[28px] shrink-0"
            gradientIdPrefix="site-header-logo"
          />
          <span className="hidden text-xl text-muted-foreground transition-colors group-hover:text-foreground dark:text-white/85 dark:group-hover:text-white sm:inline font-bold">
            {brandName}
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex flex-1">
          {navLinks.map((link) => renderNavLink(link, 'desktop'))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={ctaHref}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'inline-flex items-center gap-2 px-4',
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
                    'inline-flex items-center justify-center gap-2',
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
