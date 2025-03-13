'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Lang from '@/components/lang';
import Theme from '@/components/theme';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useStore } from '@/app/auth/store';
import { getToken } from '@/lib/cookie'
import Profile from '@/components/header/profile';
import pkg from '../../package.json'

interface NavItemProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

const NavItem = ({ href, children, className }: NavItemProps) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isActive ? 'text-primary' : 'text-foreground/70',
                className
            )}
        >
            {children}
        </Link>
    );
};

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } = useStore();
    const token = getToken()
    const isLoggedIn = !!token && !!user;
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold text-xl">{pkg.shortName}</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <NavItem href="/features">功能</NavItem>
                        <NavItem href="/pricing">价格</NavItem>
                        <NavItem href="/about">关于</NavItem>
                    </nav>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2">
                        <Lang />
                        <Theme />
                        {isLoggedIn ? (
                            <Profile user={user} />
                        ) : (
                            <Link href="/auth">
                                <Button size="sm" className="font-medium">现在开始</Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={toggleMenu}
                        aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t">
                    <div className="container py-4 space-y-4">
                        <nav className="flex flex-col space-y-4">
                            <NavItem href="/" className="px-2 py-1.5">首页</NavItem>
                            <NavItem href="/features" className="px-2 py-1.5">功能</NavItem>
                            <NavItem href="/pricing" className="px-2 py-1.5">价格</NavItem>
                            <NavItem href="/about" className="px-2 py-1.5">关于</NavItem>
                            {isLoggedIn && (
                                <NavItem href="/dashboard" className="px-2 py-1.5">控制台</NavItem>
                            )}
                        </nav>
                        <div className="flex flex-col space-y-3 pt-4 border-t">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm font-medium">语言</span>
                                <Lang />
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm font-medium">主题</span>
                                <Theme />
                            </div>
                        </div>

                        {isLoggedIn ? (
                            <div className="pt-4 border-t">
                                <div className="px-2">
                                    <Profile user={user} />
                                </div>
                            </div>
                        ) : (
                            <div className="pt-4">
                                <Link href="/auth" className="w-full">
                                    <Button size="sm" className="w-full font-medium">现在开始</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}