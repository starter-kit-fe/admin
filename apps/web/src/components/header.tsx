'use client';

import {LogoMark} from '@/components/logo-mark';
import {LanguageSwitcher} from '@/components/language-switcher';
import ThemeToggle from '@/components/theme-toggle';
import {buttonVariants} from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {cn} from '@/lib/utils';
import {Link, usePathname, useRouter} from '@/i18n/navigation';
import {useAuthStore} from '@/stores';
import {ArrowRight, LayoutDashboard, LogIn, Menu, X} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import pkg from '@/../package.json';

type StaticNavLink = {
  label: string;
  hash: string;
};

type RouteNavLink = {
  label: string;
  href: string;
};

type NavLink = StaticNavLink | RouteNavLink;

const NAV_SECTIONS = ['features', 'themes', 'resources'] as const;
type NavSection = (typeof NAV_SECTIONS)[number];

function resolveBrand() {
  const title = pkg.seo?.title ?? 'Admin Template';
  return title.split('—')[0]?.trim() ?? title;
}

export default function Header() {
  const { isAuthenticated } = useAuthStore();
  const t = useTranslations('Header');

  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const brandName = useMemo(resolveBrand, []);

  const navLinks = useMemo<NavLink[]>(
    () =>
      NAV_SECTIONS.map<StaticNavLink>((section: NavSection) => ({
        label: t(`nav.${section}`),
        hash: section,
      })),
    [t],
  );

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
  const ctaLabel = isAuthenticated ? t('cta.dashboard') : t('cta.login');
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
          <LanguageSwitcher className="hidden md:inline-flex" />
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
              aria-label={t('drawer.open')}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t('drawer.open')}</span>
            </DrawerTrigger>
            <DrawerContent className="mx-auto flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 px-4 pb-6 pt-[calc(env(safe-area-inset-top,0)+1rem)]">
              <DrawerHeader className="flex items-center justify-between gap-3 px-0 pb-1">
                <DrawerTitle className="flex items-center gap-3 text-left text-lg">
                  <LogoMark
                    className="size-10 shrink-0"
                    gradientIdPrefix="site-header-drawer-logo"
                  />
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-foreground dark:text-white">
                      {brandName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('drawer.subtitle')}
                    </span>
                  </div>
                </DrawerTitle>
                <DrawerClose
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'rounded-full border border-border/60 bg-background/90 hover:border-primary/40',
                  )}
                  aria-label={t('drawer.close')}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">{t('drawer.close')}</span>
                </DrawerClose>
              </DrawerHeader>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
                <nav className="grid gap-3 text-sm font-medium text-foreground/90">
                  {navLinks.map((link) => renderNavLink(link, 'mobile'))}
                </nav>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 shadow-sm backdrop-blur">
                  <DrawerClose asChild>
                    <Link
                      href={ctaHref}
                      className={cn(
                        buttonVariants({ size: 'lg' }),
                        'inline-flex w-full items-center justify-center gap-2',
                      )}
                    >
                      <CtaIcon className="h-4 w-4" />
                      {ctaLabel}
                    </Link>
                  </DrawerClose>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <LanguageSwitcher className="w-full justify-center" />
                    <ThemeToggle className="w-full justify-center" />
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
          <ThemeToggle className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
