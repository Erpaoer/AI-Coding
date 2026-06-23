// 数据库种子脚本 —— 填充初始数据
// 运行方式：npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始填充种子数据...\n");

  // ─── 1. 创建测试用户 ───
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);
  const vip1Password = await bcrypt.hash("vip123", 12);

  // 管理员
  const admin = await prisma.user.upsert({
    where: { email: "admin@minimall.com" },
    update: {},
    create: {
      email: "admin@minimall.com",
      password: adminPassword,
      name: "管理员",
      role: "ADMIN",
    },
  });
  console.log(`✅ 管理员: ${admin.email} / admin123`);

  // 普通用户（累计消费 0 元，普通等级）
  const user = await prisma.user.upsert({
    where: { email: "user@minimall.com" },
    update: {},
    create: {
      email: "user@minimall.com",
      password: userPassword,
      name: "测试用户",
      role: "USER",
      totalSpent: 0,
      membershipLevel: 0,
    },
  });
  console.log(`✅ 测试用户: ${user.email} / user123（普通用户）`);

  // 心悦1级演示用户（累计消费 10000 元，9.8折）
  const vip1 = await prisma.user.upsert({
    where: { email: "vip1@minimall.com" },
    update: {},
    create: {
      email: "vip1@minimall.com",
      password: vip1Password,
      name: "心悦会员1级",
      role: "USER",
      totalSpent: 10000,
      membershipLevel: 1,
    },
  });
  console.log(`✅ 心悦1级: ${vip1.email} / vip123（累计 ¥10000，享 9.8 折）`);

  // ─── 2. 创建分类 ───
  const categoryData = [
    { name: "电子产品", slug: "electronics" },
    { name: "服装", slug: "clothing" },
    { name: "家居用品", slug: "home-garden" },
    { name: "图书", slug: "books" },
    { name: "运动户外", slug: "sports" },
  ];

  const categories: Record<string, number> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created.id;
  }
  console.log(`✅ 分类: ${categoryData.length} 个`);

  // ─── 3. 创建 12 个商品 ───
  const products = [
    {
      name: "蓝牙耳机 Pro",
      price: 199,
      stock: 50,
      categorySlug: "electronics",
      desc: "高品质降噪蓝牙耳机，续航 24 小时，支持蓝牙 5.3，佩戴舒适适合长时间使用。",
    },
    {
      name: "智能手表 S1",
      price: 599,
      stock: 30,
      categorySlug: "electronics",
      desc: "1.5 英寸 AMOLED 屏幕，健康监测（心率/血氧/睡眠），IP68 防水，7 天续航。",
    },
    {
      name: "机械键盘 K87",
      price: 349,
      stock: 40,
      categorySlug: "electronics",
      desc: "Cherry MX 轴体，RGB 背光，87 键紧凑布局，PBT 键帽，Type-C 可拆卸线缆。",
    },
    {
      name: "纯棉圆领 T 恤",
      price: 79,
      stock: 200,
      categorySlug: "clothing",
      desc: "100% 精梳棉，柔软亲肤，多色可选（黑/白/灰/蓝），S-XXL 码。",
    },
    {
      name: "修身直筒牛仔裤",
      price: 159,
      stock: 100,
      categorySlug: "clothing",
      desc: "经典五袋款，微弹面料，四季通用，百搭款式。",
    },
    {
      name: "轻薄羽绒服",
      price: 459,
      stock: 60,
      categorySlug: "clothing",
      desc: "90% 白鸭绒填充，蓬松度 700+，防风防泼水面料，可收纳成小包。",
    },
    {
      name: "LED 护眼台灯",
      price: 129,
      stock: 80,
      categorySlug: "home-garden",
      desc: "国 AA 级照度，无蓝光危害，无极调光调色温，触摸控制，USB 充电口。",
    },
    {
      name: "记忆棉护颈枕",
      price: 89,
      stock: 120,
      categorySlug: "home-garden",
      desc: "慢回弹记忆棉，人体工学曲线设计，透气网眼枕套，缓解颈椎压力。",
    },
    {
      name: "不锈钢厨具 12 件套",
      price: 299,
      stock: 35,
      categorySlug: "home-garden",
      desc: "食品级不锈钢，含炒锅/汤锅/刀具/铲勺，适用于燃气灶和电磁炉。",
    },
    {
      name: "JavaScript 高级编程（第5版）",
      price: 69,
      stock: 300,
      categorySlug: "books",
      desc: "涵盖 ES2024 新特性，从原型链到异步编程，前端工程师进阶必读。",
    },
    {
      name: "三体全集（套装 3 册）",
      price: 99,
      stock: 500,
      categorySlug: "books",
      desc: "刘慈欣科幻巨著，雨果奖获奖作品，硬科幻巅峰之作。",
    },
    {
      name: "超轻跑步鞋",
      price: 329,
      stock: 90,
      categorySlug: "sports",
      desc: "单只仅重 200g，透气飞织鞋面，缓震回弹中底，适合日常跑步和健身。",
    },
  ];

  let productCount = 0;
  for (const p of products) {
    const slug = slugify(p.name);
    const categoryId = categories[p.categorySlug];
    if (!categoryId) {
      console.warn(`⚠️ 未找到分类: ${p.categorySlug}，跳过 "${p.name}"`);
      continue;
    }

    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        description: p.desc,
        price: p.price,
        stock: p.stock,
        categoryId,
        imageUrl: null, // 无图片，前端显示占位图
      },
    });
    productCount++;
  }
  console.log(`✅ 商品: ${productCount} 个\n`);

  console.log("🎉 种子数据填充完成！");
  console.log("  管理员:     admin@minimall.com / admin123");
  console.log("  普通用户:   user@minimall.com / user123");
  console.log("  心悦1级:    vip1@minimall.com / vip123（9.8折）");
}

// 简易 slug 生成（避免依赖 src/lib/utils）
function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据填充失败:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
