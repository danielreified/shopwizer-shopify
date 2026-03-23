// src/core/analytics/viewObserver.ts

export function observeViewOnce(el: HTMLElement, callback: () => void) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          callback();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
  
    observer.observe(el);
  }
  