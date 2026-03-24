import type { FC } from 'react';

interface LoginAsideProps {
  image: string;
  title: string;
}

export const LoginAside: FC<LoginAsideProps> = ({ image, title }) => {
  return (
    <aside className="relative hidden min-h-dvh w-[420px] shrink-0 overflow-hidden md:block">
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/75" />
      <div className="relative z-10 flex h-full flex-col justify-between p-10">
        <span className="text-xs tracking-[0.25em] uppercase text-white/40">
          {title}
        </span>
        <span className="text-xs tracking-[0.25em] uppercase text-white/25">
          © {new Date().getFullYear()}
        </span>
      </div>
    </aside>
  );
};
