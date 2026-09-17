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

export default function App() {
  const { activeTab } = useApp();

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row transition-colors"
      style={{
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      {/* Navigation (Sidebar on Desktop, Bottom bar on Mobile/Tablet) */}
      <Navigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with auto-formatted date & notification bell */}
        <TopBar />

        {/* Scrollable Container with responsive breakpoints */}
        <main className="flex-1 w-full max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-8">
          {activeTab === "home" && <HomeScreen />}
          {activeTab === "reports" && <ReportsScreen />}
          {activeTab === "notes" && <NotesScreen />}
          {activeTab === "tasks" && <TasksScreen />}
          {activeTab === "profile" && <ProfileScreen />}
        </main>
      </div>

      {/* Notifications Drawer/Modal */}
      <NotificationsModal />
    </div>
  );
}
