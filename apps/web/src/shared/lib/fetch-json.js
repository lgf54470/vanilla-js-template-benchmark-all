/**
 * shared/lib/fetch-json.js — 字典加载工具（docs/i18n.md §1）。
 *
 * 一律 fetch + JSON.parse，不用动态 import()：import attributes
 * （with/assert）在旧浏览器运行时被直接拒绝，会导致整屏裸 key。
 */

/**
 * @param {string | URL} url
 * @returns {Promise<Record<string, string>>} 解析失败/非对象时空字典
 */
export async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = await res.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}
