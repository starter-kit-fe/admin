'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

gsap.registerPlugin(useGSAP);

const CONSENT_STORAGE_KEY = 'admin_cookie_consent';
const CONSENT_COOKIE_NAME = 'admin_cookie_consent';

function getStoredConsent() {
  if (typeof window === 'undefined') return false;

  try {
    if (window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted') {
      return true;
    }
  } catch {
    /* ignore */
  }

  if (typeof document !== 'undefined') {
    return document.cookie
      .split(';')
      .map((s) => s.trim())
      .some((s) => s === `${CONSENT_COOKIE_NAME}=accepted`);
  }
  return false;
}

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // refs for GSAP
  const wrapperRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    setMounted(true);
    setVisible(!getStoredConsent());
  }, []);

  // 初始化 / 播放入场动画
  useGSAP(
    () => {
      if (!visible || !wrapperRef.current || !cardRef.current) return;

      const ctx = gsap.context(() => {
        const items = wrapperRef.current!.querySelectorAll('[data-cc-item]');

        // 先清理旧的时间线
        tlRef.current?.kill();

        // 入场 timeline（稍微上浮、淡入，内容 stagger）
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          paused: true,
        });

        tl
          // 外层整体浮入
          .from(wrapperRef.current, {
            y: 12,
            opacity: 0,
            duration: 0.28,
            willChange: 'transform,opacity',
          })
          // 卡片轻浮入
          .from(
            cardRef.current,
            {
              y: 8,
              opacity: 0,
              duration: 0.25,
              willChange: 'transform,opacity',
            },
            '<', // 与上一段同时开始
          )
          // 主要内容逐项进入
          .from(
            items,
            {
              y: 6,
              opacity: 0,
              duration: 0.22,
              stagger: 0.04,
              willChange: 'transform,opacity',
            },
            '-=0.06',
          );

        tl.play();
        tlRef.current = tl;
      }, wrapperRef);

      return () => ctx.revert();
    },
    { dependencies: [visible] },
  );

  const persistConsent = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
      } catch {
        /* ignore */
      }
    }
    if (typeof document !== 'undefined') {
      document.cookie = `${CONSENT_COOKIE_NAME}=accepted; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const handleAccept = () => {
    persistConsent();

    // 优先用时间线反向做退场；若未创建则直接隐藏
    if (tlRef.current) {
      tlRef.current.timeScale(1.1).reverse();
      tlRef.current.eventCallback('onReverseComplete', () => {
        setVisible(false);
      });
    } else {
      // 回退：无 tl 时也保证隐藏
      setTimeout(() => setVisible(false), 120);
    }
  };

  if (!mounted || !visible) return null;

  return (
    <section
      ref={wrapperRef}
      role="region"
      aria-live="polite"
      aria-label="Cookie 同意横幅"
      className={[
        // 移动端：底部居中；桌面端：右下角浮动
        'pointer-events-none fixed inset-x-0 bottom-0 z-[60] min-w-7xl flex justify-center',
        'px-4 pb-4 sm:px-6 sm:pb-6',
        'md:inset-x-auto md:right-6 md:bottom-6 md:justify-end',
      ].join(' ')}
    >
      <Card
        ref={cardRef}
        className={[
          'pointer-events-auto w-full max-w-6xl md:max-w-md',
          'border-border/70 bg-background/90 shadow-2xl backdrop-blur',
          'supports-[backdrop-filter]:bg-background/80',
          'rounded-2xl',
        ].join(' ')}
      >
        <CardHeader className="gap-1 pb-2" data-cc-item>
          <CardTitle className="text-base sm:text-lg">
            让我们了解你的 Cookie 偏好设置
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            我们使用必要 Cookie
            以确保网站正常运行。若选择“全部接受”，我们还会用于个性化与统计分析。
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2" data-cc-item>
            <p className="text-sm text-muted-foreground">
              始终启用以保障基础功能：
            </p>
            <ul className="list-disc pl-5 text-sm leading-6 marker:text-muted-foreground">
              <li>确保网站稳定运行</li>
              <li>防止欺诈与滥用</li>
              <li>监控性能与错误</li>
            </ul>
          </div>

          <div className="space-y-2" data-cc-item>
            <p className="text-sm text-muted-foreground">
              可选（仅在你同意后启用）：
            </p>
            <ul className="list-disc pl-5 text-sm leading-6 marker:text-muted-foreground">
              <li>个性化推荐与广告</li>
              <li>衡量广告与内容效果</li>
              <li>改进新功能与服务</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter
          className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3"
          data-cc-item
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            className="w-full sm:w-auto"
            aria-label="查看隐私与 Cookie 设置"
          >
            <Link href="/cookies">拒绝可选 Cookie</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleAccept}
            aria-label="接受全部 Cookie"
          >
            全部接受
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
