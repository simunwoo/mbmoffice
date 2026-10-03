"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mbm_wishlist";

function readWishlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeWishlist(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 저장 공간이 없거나 접근 불가(시크릿 모드 등)해도 조용히 무시 — 찜은 부가 기능입니다.
  }
}

/**
 * 상품 찜(하트) 버튼. 지금은 브라우저에만 저장되는 로컬 찜 목록으로 동작합니다.
 * 추후 네이버페이 찜 연동 시, 아래 toggle() 안의 localStorage 읽기/쓰기만
 * 네이버페이 찜 API 호출로 바꾸면 버튼·아이콘·레이아웃은 그대로 재사용할 수 있습니다.
 */
export function WishlistButton({ productId }: { productId: string }) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // localStorage는 서버에 없는 외부 저장소라 최초 렌더 후 한 번만 동기화합니다 (SSR과의 hydration 불일치 방지).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiked(readWishlist().includes(productId));
  }, [productId]);

  function toggle() {
    const current = readWishlist();
    const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
    writeWishlist(next);
    setLiked(!liked);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "찜 해제" : "찜하기"}
      className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border transition ${
        liked ? "border-brand bg-brand-soft text-brand-ink" : "border-border text-foreground-soft hover:border-brand/50"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path d="M12 21s-7.5-4.6-10-9C.3 8.5 2 4.5 6 4c2.2-.3 4 .8 6 3 2-2.2 3.8-3.3 6-3 4 .5 5.7 4.5 4 8-2.5 4.4-10 9-10 9Z" />
      </svg>
    </button>
  );
}
