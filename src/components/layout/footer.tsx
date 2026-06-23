// 页脚 —— 版权信息

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 text-center text-sm text-muted">
        <p>&copy; {new Date().getFullYear()} Mini Mall. 基于 Next.js 16 构建的全栈电商学习项目。</p>
      </div>
    </footer>
  );
}
