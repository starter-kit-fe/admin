'use client';

import HealthStatusPanel from '@/app/(main)/components/health-status';
import HeroSection from '@/app/(main)/components/hero';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Link} from '@/i18n/navigation';
import {useAuthStore} from '@/stores';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {
  Activity,
  Languages,
  Layers,
  Palette,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useCallback, useEffect, useMemo, useRef} from 'react';

const FEATURE_CARD_BLUEPRINT = [
  {key: 'interface', icon: Layers},
  {key: 'data', icon: Activity},
  {key: 'security', icon: ShieldCheck},
  {key: 'multilingual', icon: Languages},
] as const;

const THEME_CARD_BLUEPRINT = [
  {
    key: 'light',
    accent: 'from-white via-slate-100 to-white',
  },
  {
    key: 'dark',
    accent: 'from-slate-950 via-slate-900 to-slate-950',
  },
  {
    key: 'system',
    accent: 'from-slate-100 via-slate-900/40 to-slate-900',
  },
] as const;

const RESOURCE_CARD_BLUEPRINT = [
  {
    key: 'api',
    href: '/dashboard/tool/swagger',
    icon: Zap,
  },
  {
    key: 'logs',
    href: '/dashboard/system/log',
    icon: Sparkles,
  },
  {
    key: 'structure',
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

type FeatureCardKey = (typeof FEATURE_CARD_BLUEPRINT)[number]['key'];

type FeatureCardCopy = {
  title: string;
  description: string;
  highlights: string[];
};

type FeaturesCopy = {
  badge: string;
  title: string;
  description: string;
  cards: Record<FeatureCardKey, FeatureCardCopy>;
};

type ThemeCardKey = (typeof THEME_CARD_BLUEPRINT)[number]['key'];

type ThemeCardCopy = {
  name: string;
  description: string;
  badge: string;
};

type ThemesCopy = {
  badge: string;
  title: string;
  description: string;
  cards: Record<ThemeCardKey, ThemeCardCopy>;
};

type ResourceCardKey = (typeof RESOURCE_CARD_BLUEPRINT)[number]['key'];

type ResourceCardCopy = {
  title: string;
  description: string;
  cta: string;
};

type ResourcesCopy = {
  badge: string;
  title: string;
  description: string;
  cards: Record<ResourceCardKey, ResourceCardCopy>;
};

type CalloutCopy = {
  title: string;
  description: string;
  cta: {
    primary: {
      authenticated: string;
      anonymous: string;
    };
    secondary: {
      authenticated: string;
      anonymous: string;
    };
  };
};

export default function Page() {
  const t = useTranslations('Home');
  const containerRef = useRef<HTMLElement | null>(null);
  const {user: isAuthenticated} = useAuthStore();

  const featuresCopy = useMemo<FeaturesCopy>(() => t.raw('features') as FeaturesCopy, [t]);
  const themesCopy = useMemo<ThemesCopy>(() => t.raw('themes') as ThemesCopy, [t]);
  const resourcesCopy = useMemo<ResourcesCopy>(() => t.raw('resources') as ResourcesCopy, [t]);
  const calloutCopy = useMemo<CalloutCopy>(() => t.raw('callout') as CalloutCopy, [t]);

  const featureCards = useMemo(
    () =>
      FEATURE_CARD_BLUEPRINT.map(({key, icon}) => {
        const copy = featuresCopy.cards[key];
        return {
          key,
          icon,
          title: copy.title,
          description: copy.description,
          highlights: copy.highlights,
        };
      }),
    [featuresCopy],
  );

  const themeCards = useMemo(
    () =>
      THEME_CARD_BLUEPRINT.map(({key, accent}) => {
        const copy = themesCopy.cards[key];
        return {
          key,
          accent,
          name: copy.name,
          description: copy.description,
          badge: copy.badge,
        };
      }),
    [themesCopy],
  );

  const resourceCards = useMemo(
    () =>
      RESOURCE_CARD_BLUEPRINT.map(({key, href, icon}) => {
        const copy = resourcesCopy.cards[key];
        return {
          key,
          href,
          icon,
          title: copy.title,
          description: copy.description,
          cta: copy.cta,
        };
      }),
    [resourcesCopy],
  );

  const primaryCta = useMemo<ActionLink>(() => {
    const copy = calloutCopy.cta.primary;
    return isAuthenticated
      ? {
          label: copy.authenticated,
          href: '/dashboard',
          variant: 'default',
        }
      : {
          label: copy.anonymous,
          href: '/login',
          variant: 'default',
        };
  }, [calloutCopy, isAuthenticated]);

  const secondaryCta = useMemo<ActionLink>(() => {
    const copy = calloutCopy.cta.secondary;
    return isAuthenticated
      ? {
          label: copy.authenticated,
          href: '/dashboard/system/log',
          variant: 'outline',
        }
      : {
          label: copy.anonymous,
          href: 'https://github.com/starter-kit-fe/admin',
          variant: 'outline',
          target: '_blank',
          rel: 'noreferrer',
        };
  }, [calloutCopy, isAuthenticated]);

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
          className="container mx-auto px-6 pt-16 md:px-10 lg:px-12"
          data-animate-section
        >
          <div className="flex flex-col gap-4">
            <Badge
              variant="outline"
              className="w-fit border-dashed"
              data-animate="intro"
            >
              {featuresCopy.badge}
            </Badge>
            <h2
              className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              data-animate="intro"
            >
              {featuresCopy.title}
            </h2>
            <p
              className="max-w-3xl text-sm text-muted-foreground sm:text-base"
              data-animate="intro"
            >
              {featuresCopy.description}
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.key}
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
                          key={`${feature.key}-${item}`}
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
          className="container mx-auto px-6 md:px-10 lg:px-12"
          data-animate-section
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
            <div className="space-y-4">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary"
                data-animate="intro"
              >
                {themesCopy.badge}
              </Badge>
              <h2
                className="text-2xl font-semibold sm:text-3xl"
                data-animate="intro"
              >
                {themesCopy.title}
              </h2>
              <p
                className="max-w-2xl text-sm text-muted-foreground sm:text-base"
                data-animate="intro"
              >
                {themesCopy.description}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {themeCards.map((theme) => (
                <Card
                  key={theme.key}
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
          className="container mx-auto px-6 md:px-10 lg:px-12"
          data-animate-section
        >
          <div className="flex flex-col gap-4">
            <Badge
              variant="outline"
              className="w-fit border-dotted"
              data-animate="intro"
            >
              {resourcesCopy.badge}
            </Badge>
            <h2
              className="text-2xl font-semibold sm:text-3xl"
              data-animate="intro"
            >
              {resourcesCopy.title}
            </h2>
            <p
              className="max-w-3xl text-sm text-muted-foreground sm:text-base"
              data-animate="intro"
            >
              {resourcesCopy.description}
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resourceCards.map((resource) => {
              const Icon = resource.icon;
              const linkProps = resolveLinkProps(resource.href);
              return (
                <Card
                  key={resource.key}
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
                        {resource.cta}
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
                {calloutCopy.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                {calloutCopy.description}
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
