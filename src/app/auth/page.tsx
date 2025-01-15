'use client';
import ThemeToggle from '@/components/theme';
import LangToggle from '@/components/lang';
import AuthForm from './_components/form';
import { useAuthStore } from './_store';
import { redirect } from 'next/navigation';

export default function Auth() {
  // 如果有用户信息 直接回到首页
  const { user } = useAuthStore();
  if (user) redirect('/');
  return (
    <div className="w-full lg:grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center bg-[rgba(255,255,255,.7)] dark:bg-[rgba(0,0,0,.1)] justify-center py-12 relative z-10 h-screen">
        <div className="flex absolute left-[5px] top-[5px]  md:left-[20px] md:top-[20px] md:gap-1 ">
          <ThemeToggle />
          <LangToggle />
        </div>
        <AuthForm />
      </div>
      <div
        className="h-full fixed right-0 top-0 w-[100vw] md:left-1/2 
                md:w-[50vw]
                delay-400
                bg-cover bg-center bg-no-repeat
                bg-[url('https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&w=1000&dpr=2')]
                dark:bg-[url('https://images.unsplash.com/photo-1572072393749-3ca9c8ea0831?auto=format&w=1000&dpr=2')]
                bg-background
                bg-gray-200 dark:bg-gray-800
                transition-opacity duration-500 ease-in-out"
      ></div>
    </div>
  );
}
