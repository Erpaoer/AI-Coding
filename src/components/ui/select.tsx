// 通用下拉选择器组件

import { cn } from "@/lib/utils";
import { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder = "请选择",
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id || label;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full px-3 py-2 border border-border rounded-md text-sm bg-white",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          error && "border-danger focus:ring-danger/30 focus:border-danger",
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
