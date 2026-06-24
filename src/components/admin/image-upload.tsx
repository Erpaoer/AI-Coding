"use client";

// 图片上传组件 —— 点击/拖拽上传 + 预览
// 用于商品表单中的图片字段

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  name?: string;
  defaultImageUrl?: string | null;
  disabled?: boolean;
}

export function ImageUpload({
  name = "image",
  defaultImageUrl,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // 预览来源：新选文件 > 已有图片
  const displaySrc = preview || defaultImageUrl || null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 释放旧的预览 URL
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // 更新 input 的 files（通过 DataTransfer）
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) {
      inputRef.current.files = dt.files;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">商品图片</label>

      {/* 上传区域 */}
      <div
        onClick={disabled ? undefined : handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:border-primary/50 hover:bg-muted-background/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        {displaySrc ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={displaySrc}
              alt="预览"
              className="max-h-48 max-w-full object-contain rounded-md border border-border"
            />
            <p className="text-xs text-muted">
              {fileName || "已有图片"}
            </p>
            <p className="text-xs text-primary">点击更换图片</p>
          </div>
        ) : (
          <div className="text-muted">
            <p className="text-3xl mb-2">🖼️</p>
            <p className="text-sm">点击或拖拽上传图片</p>
            <p className="text-xs mt-1">支持 JPEG、PNG、WebP，最大 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
