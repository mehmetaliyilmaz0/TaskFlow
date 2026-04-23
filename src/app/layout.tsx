import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "TaskFlow",
  description:
    "TaskFlow foundation shell for a reviewer-friendly Kanban take-home project.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
