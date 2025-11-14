import type { FC } from 'react';

interface LoginAsideProps {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  highlights: string[];
  badgeLabel: string;
  footerLabel: string;
}

export const LoginAside: FC<LoginAsideProps> = ({
  image,
  imageAlt,
  title,
  description,
  highlights,
  badgeLabel,
  footerLabel,
}) => {
  return (
    <aside className="relative hidden  min-h-dvh flex-1 overflow-hidden md:flex">
      <img
        src={image}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover "
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-900/60" />
      <div className="relative z-10 flex flex-1 flex-col justify-between px-10 py-12 text-slate-100">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
            {badgeLabel}
          </span>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            {title}
          </h1>
          <p className="max-w-md text-sm text-white/75 md:text-base">
            {description}
          </p>
        </div>
        <ul className="space-y-4 text-sm text-white/80 md:text-base">
          {highlights.map((tip) => (
            <li
              key={tip}
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-300" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          {footerLabel}
        </p>
      </div>
    </aside>
  );
};
