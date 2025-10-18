'use client';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useMemo, useRef, useState } from 'react';

import pkg from '../../../../package.json';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
] as const;

export default function HeroSection() {
  const { user, isAuthenticated } = useAuthStore();
  const heroRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  console.log(user, isAuthenticated);
  const heroTitle = useMemo(() => {
    const [main, ...rest] = (pkg.seo?.title ?? 'Admin Template')
      .split('—')
      .map((item) => item.trim());
    return {
      main,
      secondary: rest.join(' — '),
    };
  }, []);

  const keywords = useMemo(() => pkg.seo.keywords.slice(0, 3), []);

  const [heroImage, setHeroImage] = useState<string>(HERO_IMAGES[0]);

  useEffect(() => {
    const root = heroRef.current;
    if (!root) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from(root.querySelectorAll('.hero-animate'), {
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
    }, root);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) {
      return;
    }
    const index = Math.floor(Math.random() * HERO_IMAGES.length);
    const chosen = HERO_IMAGES[index] ?? HERO_IMAGES[0];
    setHeroImage(chosen);
  }, []);

  const ctaHref = isAuthenticated ? '/dashboard' : '/login';

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative isolate overflow-hidden border-b bg-background pb-20 pt-28 sm:pt-32"
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

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 md:px-10 lg:px-12">
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
    </section>
  );
}
