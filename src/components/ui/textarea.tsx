// 通用多行文本输入组件

import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={4}
        className={cn(
          "w-full px-3 py-2 border border-border rounded-md text-sm resize-y",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "placeholder:text-muted",
          error && "border-danger focus:ring-danger/30 focus:border-danger",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
