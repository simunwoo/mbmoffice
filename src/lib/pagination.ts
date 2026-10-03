export type PageItem = number | "ellipsis";

export function getPageItems(current: number, total: number, siblingCount = 1, boundaryCount = 1): PageItem[] {
  const startPages = range(1, Math.min(boundaryCount, total));
  const endPages = range(Math.max(total - boundaryCount + 1, boundaryCount + 1), total);

  const siblingsStart = Math.max(
    Math.min(current - siblingCount, total - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2
  );
  const siblingsEnd = Math.max(
    Math.min(current + siblingCount, total - boundaryCount - 1),
    boundaryCount + 2 < siblingsStart ? siblingsStart : boundaryCount + 1
  );

  const items: PageItem[] = [...startPages];

  if (siblingsStart > boundaryCount + 2) {
    items.push("ellipsis");
  } else if (boundaryCount + 1 < total - boundaryCount) {
    items.push(boundaryCount + 1);
  }

  items.push(...range(siblingsStart, siblingsEnd));

  if (siblingsEnd < total - boundaryCount - 1) {
    items.push("ellipsis");
  } else if (total - boundaryCount > boundaryCount) {
    items.push(total - boundaryCount);
  }

  items.push(...endPages);

  return items;
}

function range(start: number, end: number): number[] {
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
