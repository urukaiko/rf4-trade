// Toast notification helper configuration
// Uses svelte-5-french-toast for Svelte 5 compatible notifications
import toast, { Toaster } from 'svelte-5-french-toast';

export { Toaster };

// Default configuration:
// - Position: top-right
// - Duration: 3000ms
// - Close on click: true (built-in)
// - Theme: light (matches existing UI)

function safeToast(fn: () => void) {
  try {
    fn();
  } catch {
    // Toast provider unmounted — fail silently to prevent UI crashes
  }
}

export function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  switch (type) {
    case 'success':
      safeToast(() => toast.success(message));
      break;
    case 'error':
      safeToast(() => toast.error(message));
      break;
    case 'warning':
      safeToast(() =>
        toast(message, {
          icon: '⚠️',
          duration: 4000,
        })
      );
      break;
    case 'info':
    default:
      safeToast(() => toast(message));
      break;
  }
}

export function success(message: string) {
  safeToast(() => toast.success(message));
}

export function error(message: string) {
  safeToast(() => toast.error(message));
}

export function info(message: string) {
  safeToast(() => toast(message));
}

export function warning(message: string) {
  safeToast(() =>
    toast(message, {
      icon: '⚠️',
      duration: 4000,
    })
  );
}
