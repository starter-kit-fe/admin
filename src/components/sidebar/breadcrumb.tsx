import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { data as Menus } from './menu';

// Type definition for menu items
interface MenuItem {
  title: string;
  url: string;
  items?: MenuItem[];
}

export default function BreadcrumbNavigation() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const items: { title: string; url: string }[] = [
      { title: '控制台', url: '/dashboard' },
    ];

    const findPath = (menuItems: MenuItem[], parentTitle?: string): boolean => {
      for (const item of menuItems) {
        // Direct match found
        if (item.url === pathname) {
          if (parentTitle) {
            items.push({ title: parentTitle, url: '#' });
          }
          items.push({ title: item.title, url: item.url });
          return true;
        }

        // Recursively search nested items
        if (item.items) {
          const found = findPath(
            item.items,
            item.url === '#' ? item.title : parentTitle
          );
          if (found) return true;
        }
      }
      return false;
    };

    findPath(Menus);
    return items;
  }, [pathname]);

  // Early return if no breadcrumbs or only dashboard
  if (breadcrumbs.length <= 1) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => {
          const isLastItem = index === breadcrumbs.length - 1;
          return (
            <div
              key={`${item.url}-${index}`}
              className="md:flex hidden justify-center items-center"
            >
              <BreadcrumbItem>
                {isLastItem ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.url}>{item.title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLastItem && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
