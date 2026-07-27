import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "导入语料 · Personal English Bank",
  description: "上传或粘贴 GPT 整理后的 Curated Import Package。",
};

export default function ImportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
