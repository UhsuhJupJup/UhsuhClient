import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "구독",
  description: "관심 키워드를 담아두면 새 글이 올라올 때 메일로 알려드려요",
};

export default function SubscribeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
