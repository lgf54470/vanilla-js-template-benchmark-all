// apps/web/src/shared/lib/fetch-json.js — fetch + JSON.parse 字典加载（i18n.md §1）
//
// 唯一允许的字典加载方式：禁止 import(..., { with: { type: "json" } })
// （旧浏览器整体拒绝 → 整屏裸 key，见 docs/bug/2026-08-28-i18n-runtime-switch-dead.md）。
// 重试语义：默认 1 次重试（共 2 次尝试），适合开发期 watch 重启的偶发 500。

/**
 * @param {string|URL} url
 * @param {{ retries?: number }} [opts]
 * @returns {Promise<any>} 解析后的 JSON 值
 */
export async function fetchJSON(url, { retries = 1 } = {}) {
  let lastErr = null;
  for (let i = 0; i <= retries; i += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("fetchJSON failed");
}
