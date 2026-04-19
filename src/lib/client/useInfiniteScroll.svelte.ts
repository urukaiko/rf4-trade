import { browser } from '$app/environment';

/**
 * Svelte 5 rune-based IntersectionObserver hook for infinite scroll.
 *
 * @returns `{ trigger, isIntersecting, cleanup }` — attach `trigger` to a sentinel element
 */
export function useInfiniteScroll(): {
  trigger: (node: HTMLElement | null) => void;
  isIntersecting: boolean;
  cleanup: () => void;
} {
  let isIntersecting = $state(false);
  let observer: IntersectionObserver | null = null;
  let currentNode: HTMLElement | null = null;
  let destroyed = false;

  function cleanup() {
    destroyed = true;
    observer?.disconnect();
    observer = null;
    currentNode = null;
  }

  function trigger(node: HTMLElement | null) {
    if (destroyed) return;

    // Clean up previous observer
    observer?.disconnect();
    currentNode = node;

    if (!browser || !node) {
      isIntersecting = false;
      return;
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry?.isIntersecting ?? false;
      },
      { rootMargin: '100px' },
    );

    observer.observe(node);
  }

  return { trigger, isIntersecting, cleanup };
}
