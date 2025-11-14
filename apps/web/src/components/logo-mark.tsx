'use client';

import { cn } from '@/lib/utils';
import { type SVGProps } from 'react';

type LogoMarkProps = SVGProps<SVGSVGElement> & {
  /** 是否左右镜像（默认 true：小圆点在左边） */
  mirror?: boolean;
  /** 小圆点半径（默认 44） */
  dotRadius?: number;
  gradientIdPrefix?: string;
};

export function LogoMark({
  className,
  mirror = true,
  dotRadius = 44,
  gradientIdPrefix = 'logo-mark',
  ...props
}: LogoMarkProps) {
  const gMain = `${gradientIdPrefix}-g-main`;
  const gBase = `${gradientIdPrefix}-g-base`;
  const strokeColor = 'oklch(from var(--primary) l c h / 0.18)'; // 极淡描边

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-7 w-7', className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        {/* 主体渐变：浅主色 → 基础主色 → 稍深主色 */}
        <linearGradient
          id={gMain}
          x1="86"
          y1="128"
          x2="86"
          y2="384"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="color-mix(in oklch, var(--primary) 55%, white 45%)" />
          <stop offset="0.5" stopColor="var(--primary)" />
          <stop
            offset="1"
            stopColor="color-mix(in oklch, var(--primary) 80%, black 20%)"
          />
        </linearGradient>

        {/* 底部片段：更亮一些，用浅主色到基础主色 */}
        <linearGradient
          id={gBase}
          x1="152"
          y1="168"
          x2="65.5"
          y2="260"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="color-mix(in oklch, var(--primary) 35%, white 65%)" />
          <stop
            offset="1"
            stopColor="color-mix(in oklch, var(--primary) 70%, white 30%)"
          />
        </linearGradient>
      </defs>

      {/* 镜像整体，让小球在左侧 */}
      <g transform={mirror ? 'matrix(-1 0 0 1 512 0)' : undefined}>
        {/* 底部片段 */}
        <path
          fill={`url(#${gBase})`}
          stroke={strokeColor}
          strokeWidth="0.8"
          d="M86.352 246.358C137.511 214.183 161.836 245.017 183.168 285.573C165.515 317.716 153.837 337.331 148.132 344.418C137.373 357.788 125.636 367.911 111.202 373.752C80.856 388.014 43.132 388.681 14 371.048L86.352 246.358Z"
        />

        {/* 主体波形 */}
        <path
          fill={`url(#${gMain})`}
          stroke={strokeColor}
          strokeWidth="0.8"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M444.31 229.726C398.04 148.77 350.21 72.498 295.267 184.382C287.751 198.766 282.272 226.719 270 226.719V226.577C257.728 226.577 252.251 198.624 244.735 184.24C189.79 72.356 141.96 148.628 95.689 229.584C92.207 235.69 88.862 241.516 86 246.58C192.038 179.453 183.11 382.247 270 383.858V384C356.891 382.389 347.962 179.595 454 246.72C451.139 241.658 447.794 235.832 444.31 229.726Z"
        />

        {/* 小球：纯主题色 */}
        <circle
          cx="450"
          cy="336"
          r={dotRadius}
          fill="var(--primary)"
          stroke={strokeColor}
          strokeWidth="0.8"
        />
      </g>
    </svg>
  );
}
