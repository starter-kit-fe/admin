import { cn } from '@/lib/utils';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useMediaQuery } from '@/hooks/use-media-query';

interface FormDialogLayoutProps {
  title: string;
  description?: string;
  contentClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function FormDialogLayout({
  title,
  description,
  contentClassName,
  bodyClassName,
  footerClassName,
  children,
  footer,
}: FormDialogLayoutProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <ResponsiveDialog.Content className={contentClassName}>
      <div className="flex max-h-[80vh] min-h-0 flex-col gap-4">
        <ResponsiveDialog.Header className={cn(isMobile && '!text-left')}>
          <ResponsiveDialog.Title>{title}</ResponsiveDialog.Title>
          {description ? (
            <ResponsiveDialog.Description>
              {description}
            </ResponsiveDialog.Description>
          ) : null}
        </ResponsiveDialog.Header>

        <div
          className={cn(
            'flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-0',
            bodyClassName,
          )}
        >
          {children}
        </div>

        <ResponsiveDialog.Footer
          className={cn(
            'flex flex-col gap-2 sm:flex-row sm:justify-end',
            isMobile &&
              'sticky bottom-0 left-0 right-0 z-10 w-full flex-row items-center justify-between gap-3 rounded-none border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur sm:static sm:justify-end sm:border-none sm:bg-transparent sm:px-0 sm:py-0',
            footerClassName,
          )}
        >
          {footer}
        </ResponsiveDialog.Footer>
      </div>
    </ResponsiveDialog.Content>
  );
}
