'use client';
import Image from 'next/image';
import UserNav from '../user-nav';
import ThemeSwitcher from '@/components/theme';
import LangToggle from '@/components/lang';
export default function Header() {
  return (
    <div className="border-grid sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <Image src="/pwa-192x192.png" height={40} width={40} alt="logo" />
        <div className="text-2xl font-bold ml-2 ">The admin</div>
        <div className="ml-auto flex items-center space-x-4">
          <div>
            <ThemeSwitcher />
            <LangToggle />
          </div>
          <UserNav />
        </div>
      </div>
    </div>
  );
}
