'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

type SessionDialogOptions = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

type SessionDialogProps = SessionDialogOptions;

let dialogContainer: HTMLDivElement | null = null;
let dialogRoot: Root | null = null;
let isDialogActive = false;

function cleanupDialog() {
  if (dialogRoot) {
    dialogRoot.unmount();
    dialogRoot = null;
  }
  if (dialogContainer?.parentNode) {
    dialogContainer.parentNode.removeChild(dialogContainer);
  }
  dialogContainer = null;
  isDialogActive = false;
}

function SessionExpiredDialog({ message, onConfirm, onCancel }: SessionDialogProps) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>登录状态已过期</AlertDialogTitle>
          <AlertDialogDescription>
            {message || '当前会话已失效，请重新登录后继续操作。'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={(event) => {
              event.preventDefault();
              onCancel();
            }}
          >
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            重新登录
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function showSessionExpiredDialogUI(options: SessionDialogOptions) {
  if (typeof document === 'undefined') {
    return;
  }

  if (isDialogActive) {
    cleanupDialog();
  }

  if (!dialogContainer) {
    dialogContainer = document.createElement('div');
    dialogContainer.id = 'session-expired-dialog-root';
    document.body.appendChild(dialogContainer);
  }

  if (!dialogRoot) {
    dialogRoot = createRoot(dialogContainer);
  }

  isDialogActive = true;

  const closeOnce = (callback: () => void) => {
    if (!isDialogActive) {
      return;
    }
    isDialogActive = false;
    cleanupDialog();
    callback();
  };

  dialogRoot.render(
    <SessionExpiredDialog
      message={options.message}
      onConfirm={() => closeOnce(options.onConfirm)}
      onCancel={() => closeOnce(options.onCancel)}
    />,
  );
}
