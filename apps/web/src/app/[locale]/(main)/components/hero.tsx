"use client";

import {Badge} from '@/components/ui/badge';
import {buttonVariants} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {Link} from '@/i18n/navigation';
import {useAuthStore} from '@/stores';
import gsap from 'gsap';
import {ArrowRight} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
] as const;

const BACKDROP_SWITCH_DELAY = 1300;

type HeroHeadingCopy = {
  badge?: string;
  title: string;
  description: string;
};

const DEFAULT_HEADING_COPY: HeroHeadingCopy = {
  badge: 'Modern dashboard UI for developers',
  title: 'Admin Template | Modern Dashboard for Web Apps',
  description:
    'A clean and responsive admin dashboard template built for modern web apps.',
};

const DEFAULT_KEYWORDS = ['Dashboard UI', 'React admin', 'Next.js'];

const pickRandomHeroImage = (exclude?: string) => {
  const pool = exclude
    ? HERO_IMAGES.filter((image) => image !== exclude)
    : [...HERO_IMAGES];
  const fallbackPool = pool.length ? pool : HERO_IMAGES;
  const index = Math.floor(Math.random() * fallbackPool.length);
  return fallbackPool[index] ?? HERO_IMAGES[0];
};

export default function HeroSection() {
  const { user, isAuthenticated } = useAuthStore();
  const t = useTranslations('Hero');
  const heroRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const crossfadeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasAnimatedBackdropRef = useRef(false);
  const headingCopy = useMemo<HeroHeadingCopy>(() => {
    const rawHeading = t.raw('heading');
    if (rawHeading && typeof rawHeading === 'object') {
      return rawHeading as HeroHeadingCopy;
    }
    return DEFAULT_HEADING_COPY;
  }, [t]);
  const keywords = useMemo(() => {
    const rawKeywords = t.raw('keywords');
    return Array.isArray(rawKeywords)
      ? (rawKeywords as string[])
      : DEFAULT_KEYWORDS;
  }, [t]);

  const [heroImage, setHeroImage] = useState<string>(HERO_IMAGES[0]);
  const currentHeroImageRef = useRef(heroImage);

  useEffect(() => {
    currentHeroImageRef.current = heroImage;
  }, [heroImage]);

  const changeHeroImage = useCallback((nextImage: string) => {
    if (!nextImage || nextImage === currentHeroImageRef.current) {
      return;
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setHeroImage(nextImage);
      currentHeroImageRef.current = nextImage;
      return;
    }

    const backdrop = backdropRef.current;
    if (!backdrop) {
      setHeroImage(nextImage);
      currentHeroImageRef.current = nextImage;
      return;
    }

    crossfadeTimelineRef.current?.kill();

    const timeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        crossfadeTimelineRef.current = null;
      },
    });

    timeline.to(backdrop, { opacity: 0, duration: 0.45 });
    timeline.add(() => {
      setHeroImage(nextImage);
      currentHeroImageRef.current = nextImage;
    });
    timeline.to(backdrop, { opacity: 1, duration: 0.65 });

    crossfadeTimelineRef.current = timeline;
  }, []);

  useEffect(() => {
    return () => {
      crossfadeTimelineRef.current?.kill();
    };
  }, []);

  useLayoutEffect(() => {
    const root = heroRef.current;
    if (!root || typeof window === 'undefined') {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      const heroTargets = root.querySelectorAll<HTMLElement>('.hero-animate');
      if (!heroTargets.length) {
        return;
      }

      gsap.set(heroTargets, { y: 28, opacity: 0 });

      gsap.to(heroTargets, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        clearProps: 'transform,opacity',
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
            clearProps: 'opacity,scale',
          },
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1 || hasAnimatedBackdropRef.current) {
      return;
    }

    hasAnimatedBackdropRef.current = true;

    const timer = window.setTimeout(() => {
      const nextHeroImage = pickRandomHeroImage(currentHeroImageRef.current);
      changeHeroImage(nextHeroImage);
    }, BACKDROP_SWITCH_DELAY);

    return () => window.clearTimeout(timer);
  }, [changeHeroImage]);

  const ctaHref = isAuthenticated ? '/dashboard' : '/login';
  const heroBadgeKeys = ['dark', 'light', 'system'] as const;
  const cardBadges = heroBadgeKeys.map((badgeKey) =>
    t(`card.badges.${badgeKey}`),
  );
  const cardBody = t.rich('card.body', {
    code: (chunks) => (
      <code className="font-mono text-primary" data-slot="inline-code">
        {chunks}
      </code>
    ),
  });

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative isolate   overflow-hidden border-b bg-background pb-20 pt-28 sm:pt-32"
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

      <div className="mx-auto flex  flex-col gap-12 px-6 container md:px-10 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center">
          <div className="flex flex-col gap-6 text-left">
            {headingCopy.badge ? (
              <Badge
                variant="outline"
                className="hero-animate w-fit border-primary/40 bg-background/80 text-primary backdrop-blur"
              >
                {headingCopy.badge}
              </Badge>
            ) : null}
            <h1 className="hero-animate text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {headingCopy.title}
            </h1>
            <p className="hero-animate max-w-2xl text-base text-muted-foreground sm:text-lg">
              {headingCopy.description}
            </p>
            <div className="hero-animate flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'group w-full justify-center sm:w-auto',
                )}
              >
                {user ? t('primaryCta.authenticated') : t('primaryCta.anonymous')}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'lg' }),
                  'w-full justify-center sm:w-auto',
                )}
              >
                {t('secondaryCta')}
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
              <CardTitle className="text-lg">{t('card.title')}</CardTitle>
              <CardDescription>{t('card.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {cardBadges.map((item) => (
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
                  {cardBody}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
