// 常量定义：角色、订单状态、分页默认值、图片上传限制

export const ROLES = ["USER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// 订单状态的中文映射
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  PROCESSING: "处理中",
  SHIPPED: "已发货",
  DELIVERED: "已送达",
  CANCELLED: "已取消",
};

// ─── 心悦会员等级 ───
// 累计消费金额门槛 + 对应折扣率
export const MEMBERSHIP_LEVELS = [
  { level: 0, name: "普通用户", minSpent: 0, discount: 1.0 },     // 无折扣
  { level: 1, name: "心悦1级", minSpent: 8000, discount: 0.98 },  // 9.8折
  { level: 2, name: "心悦2级", minSpent: 80000, discount: 0.95 }, // 9.5折
  { level: 3, name: "心悦3级", minSpent: 800000, discount: 0.9 }, // 9折
] as const;

/** 根据累计消费金额计算心悦等级 */
export function getMembershipLevel(totalSpent: number) {
  let level = 0;
  for (const ml of MEMBERSHIP_LEVELS) {
    if (totalSpent >= ml.minSpent) level = ml.level;
  }
  return level;
}

/** 根据心悦等级获取折扣率 */
export function getDiscountByLevel(level: number): number {
  return MEMBERSHIP_LEVELS[level]?.discount ?? 1.0;
}

export const PAGINATION_DEFAULTS = {
  SHOP_PAGE_SIZE: 12, // 前台每页商品数
  ADMIN_PAGE_SIZE: 20, // 后台每页记录数
} as const;

// 图片上传限制
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
