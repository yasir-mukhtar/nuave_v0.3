import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        minHeight: "100vh",
      }}
    >
      <Sidebar
        credits={85}
        userName="Yasir Mukthar"
        workspaceName="Peruri"
      />
      <main
        style={{
          marginLeft: "240px",
          flex: 1,
          overflowY: "auto",
          padding: "32px",
          background: "var(--bg-page)",
        }}
      >
        {children}
      </main>
    </div>
  );
}

