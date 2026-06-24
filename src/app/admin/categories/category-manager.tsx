"use client";

// 分类管理客户端组件 —— 行内新增 + 删除
// 通过 fetch 调用 /api/admin/categories

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  createdAt: Date | string;
  _count: { products: number };
}

interface CategoryManagerProps {
  categories: CategoryData[];
}

export function CategoryManager({ categories: initialCategories }: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      setError("请输入分类名称");
      return;
    }
    if (name.length > 50) {
      setError("分类名称不能超过 50 字");
      return;
    }

    setError(null);
    setAdding(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "创建失败");
        return;
      }

      const created = await res.json();
      setCategories((prev) => [created, ...prev]);
      setNewName("");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number, name: string, productCount: number) => {
    if (productCount > 0) {
      alert(`分类「${name}」下还有 ${productCount} 个商品，无法删除`);
      return;
    }

    if (!window.confirm(`确定要删除分类「${name}」吗？此操作不可撤销。`)) return;

    setError(null);
    setDeleting(id);

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "删除失败");
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setDeleting(null);
    }
  };

  // 表单提交处理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdd();
  };

  return (
    <div>
      {/* 新增表单 */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <Input
          placeholder="输入分类名称，如「电子产品」"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setError(null);
          }}
          maxLength={50}
          className="flex-1"
        />
        <Button type="submit" disabled={adding}>
          {adding ? "创建中..." : "+ 新增分类"}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-danger mb-3">{error}</p>
      )}

      {/* 分类列表 */}
      {categories.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">暂无分类，请添加</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 font-medium text-muted">名称</th>
                <th className="text-left py-3 font-medium text-muted">URL 标识</th>
                <th className="text-right py-3 font-medium text-muted">商品数</th>
                <th className="text-right py-3 font-medium text-muted">创建时间</th>
                <th className="text-right py-3 font-medium text-muted">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{cat.name}</td>
                  <td className="py-3 text-muted font-mono text-xs">{cat.slug}</td>
                  <td className="py-3 text-right">
                    <Badge variant={cat._count.products > 0 ? "info" : "default"}>
                      {cat._count.products}
                    </Badge>
                  </td>
                  <td className="py-3 text-right text-muted">
                    {formatDate(cat.createdAt)}
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deleting === cat.id}
                      onClick={() => handleDelete(cat.id, cat.name, cat._count.products)}
                    >
                      {deleting === cat.id ? "删除中..." : "删除"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
