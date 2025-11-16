import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

type SessionDialogOptions = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

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

export function showSessionExpiredDialog({
  message,
  onConfirm,
  onCancel,
}: SessionDialogOptions) {
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

  const openDialog = () =>
    import('@/components/session-expired-dialog')
      .then(({ showSessionExpiredDialogUI }) => {
        showSessionExpiredDialogUI({
          message,
          onConfirm: () => closeOnce(onConfirm),
          onCancel: () => closeOnce(onCancel),
        });
      })
      .catch(() => {
        const confirmed =
          typeof window.confirm === 'function' ? window.confirm(message) : true;
        if (confirmed) {
          closeOnce(onConfirm);
        } else {
          closeOnce(onCancel);
        }
      });

  void openDialog();
}
