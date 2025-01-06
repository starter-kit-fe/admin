'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/logo';

interface LinkItemProps {
  label: string;
  href: string;
}

interface NavProps {
  links: LinkItemProps[];
  isMobile: boolean;
}

export default function Nav({ links, isMobile }: NavProps) {
  const pathname = usePathname();
  return (
    <nav
      className={`${
        isMobile ? 'grid' : 'hidden md:flex md:flex-row'
      } gap-6 text-lg font-medium md:gap-5 md:text-sm lg:gap-6 items-center`}
    >
      <Logo />
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className={`${
            isMobile ? '' : 'whitespace-nowrap'
          } transition-colors hover:text-foreground ${
            pathname === link.href
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
