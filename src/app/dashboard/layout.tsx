import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/app/dashboard/_components/sidebar/layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar>
        <main className="container mx-auto md:px-[5%] py-2">{children}</main>
      </AppSidebar>
    </SidebarProvider>
  );
}
