# MBM Crawl Summary

Crawled 2026-09-23 via curl with a Chrome UA (WAF blocked WebFetch, curl worked fine). All output files are in this directory.

## Counts

| File | Records | Source |
|---|---|---|
| `products.json` | 115 | all `shop_view/NN` URLs from `sitemap.xml` |
| `installs.json` | 90 | `/review` board, pages 1-9 (`?page=N`), 10/page |
| `blog_site.json` | 37 | `/blog/?bmode=view&idx=N` board, pages 1-10 |
| `blog_naver.json` | 107 | blog.naver.com/mbmoffice, **full coverage** (107/107 total posts, via legacy `PostTitleListAsync.naver` JSON API + `m.blog.naver.com/PostView.naver` for content) |

## Products (115)

- Brands: 후지필름 75, 후지제록스 17, 캐논 4, 세돌이 10 (문서세단기), 교세라 3, 신도리코 1, "조립PC" 2, null 3 (자체조립PC, brand field says "상세페이지 참고" on site).
- Categories found: 복합기·프린터 컬러(21)/흑백(4) rental units, 복합기 소모품 (토너/회수통 등, 71 across Apeos/ApeosPort/DocuCentre V/DC SC2020 subcategories), 문서세단기(10, both 구매+렌탈), 부품(2, 급지롤러), PC(5, 조립PC 구매+렌탈), IT유지보수 서비스(3).
- **No products found** for 노트북 or 나스(NAS) - both category pages return "해당 카테고리에 상품이 없습니다." (empty), confirmed live on site, not a crawl gap.
- Each record includes an extra `listingType` field (렌탈 상품/구매 상품/서비스,솔루션상품) and `categoryPath` (full breadcrumb) beyond the requested schema, plus `origin`/`maker`/`weight` when shown.
- All 115 product names are unique - no legacy-URL/homepage-fallback contamination detected (the `/24/?idx=NN`-style issue mentioned in the brief did not occur since sitemap only exposed clean `shop_view/NN` URLs).
- Two globally-shared boilerplate banner images (appearing on ~85%+ of products) were filtered out of the `images` arrays as they're template graphics, not product photos.

## Installs / 설치사례 (90)

- All 9 listing pages fetched via plain `?page=N` (no need for the `q=`/`only_photo` params seen in hrefs).
- Recent posts (~2026, roughly the newest 20-25) have a structured "프로젝트 개요" block (지역/업종/설치 장비/작업 내용) parsed directly; older posts required regex/keyword-based fallback from the title.
- Field fill rates: region 86/90, industry 82/90, brand 87/90, model 87/90, date 90/90 (newest post used relative "1일전", converted using 2026-09-23 as today), images 90/90.
- Nulls remaining are mostly general "how to choose a copier" advisory posts with no specific site/install (e.g. "복합기 단기 vs 장기 렌탈 선택 기준"), or titles too terse to regex-parse a region/industry confidently - left null rather than guessed.

## Blog (site, 37)

- `/blog` board, 10 listing pages, 37 unique idx values.
- 4 categories used: 사무기기 정보 (25), 제품 소개 (8), 복합기 설치방법 (3), 공지사항 (1).
- **No literal `<h2>`/`<h3>` tags exist anywhere in these posts** (verified via grep on raw HTML) - subheading-like lines are just plain paragraph text (occasionally wrapped in `<strong>`), so no heading structure could be preserved beyond paragraph breaks.
- 100% fill rate on category/date/images/body.

## Blog (Naver, 107 of 107 - full coverage)

- Naver's legacy `PostTitleListAsync.naver?blogId=mbmoffice&currentPage=N` JSON endpoint returned the full post list directly (no JS rendering needed) - `totalCount: 107`, confirmed 107 unique `logNo` values collected across 4 pages.
- Post content fetched via `m.blog.naver.com/PostView.naver?blogId=mbmoffice&logNo=<ID>` - server-rendered Smart Editor content, no iframe/frameset issue in practice.
- Hit HTTP 429 rate-limiting on one batch of 8 posts during parallel fetch (6 concurrent); all 8 recovered on retry with 2s delays, sequential.
- Categories: 사무용 복합기 (49), 설치 사례 (21), MBM 정보 (21), PC 유지보수 (6), 설치 방법 (5), 제품 소개 (4), 추천 제품 (1).
- Date range: 2024-11-11 to 2026-09-22. 100% fill rate on title/category/date/body/images.

## Notes / potential follow-ups

- `/solution` and `/solution2` are static informational pages (not board-driven), already represented in the catalog by the 3 "IT유지보수 서비스" shop items; "출력물 보안 솔루션" is mentioned as a service on `/solution` but has no dedicated shop_view product page.
- Image URLs are the CDN originals as linked in HTML (`cdn.imweb.me`, `mblogthumb-phinf.pstatic.net`, etc.) - not downloaded, per instructions.
- No pages returned non-200 status during the crawl; no pagination limits were hit (all boards fully enumerated).
