"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <TabBar />
    </div>
  );
}
