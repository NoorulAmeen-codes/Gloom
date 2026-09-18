"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";
import { Navigation } from "@/components/Navigation";
import { NotificationsModal } from "@/components/NotificationsModal";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ReportsScreen } from "@/components/screens/ReportsScreen";
import { NotesScreen } from "@/components/screens/NotesScreen";
import { TasksScreen } from "@/components/screens/TasksScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ExpensesScreen } from "@/components/screens/ExpensesScreen";

export default function App() {
  const { activeTab, isLoading } = useApp();
  if (isLoading) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      <div className="text-sm font-medium">
        Loading Gloop...
      </div>
    </div>
  );
}

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row transition-colors"
      style={{
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      <Navigation />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 w-full max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-8">
          <div style={{ display: activeTab === "home" ? "block" : "none" }}>
            <HomeScreen />
            </div>

            <div style={{ display: activeTab === "reports" ? "block" : "none" }}>
            <ReportsScreen />
            </div>

            <div style={{ display: activeTab === "notes" ? "block" : "none" }}>
            <NotesScreen />
            </div>

            <div style={{ display: activeTab === "tasks" ? "block" : "none" }}>
            <TasksScreen />
            </div>

            <div style={{ display: activeTab === "expenses" ? "block" : "none" }}>
            <ExpensesScreen />
            </div>

            <div style={{ display: activeTab === "profile" ? "block" : "none" }}>
            <ProfileScreen />
            </div>
        </main>
      </div>

      <NotificationsModal />
    </div>
  );
}