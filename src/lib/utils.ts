// 通用工具函数：slug 生成、金额格式化、日期格式化、类名合并

/**
 * 将中文/英文文本转换为 URL 友好的 slug
 * 例：slugify("蓝牙耳机 Pro") → "lan-ya-er-ji-pro"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFKD") // 将 Unicode 字符分解（如 à → a + 重音符）
    .replace(/[̀-ͯ]/g, "") // 去除重音符
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // 非字母数字 → 连字符
    .replace(/^-+|-+$/g, "") // 去除首尾连字符
    .substring(0, 80); // 截断到 80 字符
}

/** 格式化为人民币 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

/** 格式化为中文日期时间 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** 合并 CSS 类名，过滤掉假值 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
