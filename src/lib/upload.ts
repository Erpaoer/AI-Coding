// 图片上传工具：校验 + sharp 压缩转 webp + 写入文件系统

import sharp from "sharp";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "./constants";

// 上传目录（相对于项目根目录）
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

/**
 * 保存产品图片到 public/uploads/products/
 * @param file - 前端上传的 File 对象
 * @returns 图片的相对 URL 路径，如 "/uploads/products/1719600000-uuid.webp"
 */
export async function saveProductImage(file: File): Promise<string> {
  // 校验文件类型
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`不支持的图片格式: ${file.type}，仅支持 JPEG、PNG、WebP`);
  }

  // 校验文件大小
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`图片不能超过 ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }

  // 读取文件内容
  const buffer = Buffer.from(await file.arrayBuffer());

  // sharp 压缩：最大 1200×1200 等比例缩放，输出 webp 质量 80
  const optimized = await sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // 确保上传目录存在
  await mkdir(UPLOAD_DIR, { recursive: true });

  // 生成唯一文件名
  const filename = `${Date.now()}-${crypto.randomUUID()}.webp`;
  await writeFile(path.join(UPLOAD_DIR, filename), optimized);

  return `/uploads/products/${filename}`;
}

/**
 * 删除已上传的产品图片
 * @param imageUrl - 图片的相对 URL 路径
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith("/uploads/products/")) return;

  const filename = path.basename(imageUrl);
  const filepath = path.join(UPLOAD_DIR, filename);

  try {
    await unlink(filepath);
  } catch {
    // 文件不存在则忽略
  }
}
