// src/fetch/product.tsx

const cache = new Map();

export async function fetchProductByHandle(handle: string) {
  const url = `/products/${encodeURIComponent(handle)}.js`;

  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} for ${url}`);
        return r.json();
      })
    );
  }

  return cache.get(url);
}
