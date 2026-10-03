declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4로 전환 이벤트를 보냅니다. 측정 ID가 설정돼 있지 않거나 로드 전이면 조용히 무시합니다. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
