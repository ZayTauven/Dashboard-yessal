"use client";

import dynamic from "next/dynamic";

const AdminDashboard = dynamic(() => import("./roles/AdminDashboard"), { ssr: false });
const MemberDashboard = dynamic(() => import("./roles/MemberDashboard"), { ssr: false });
const CollectorDashboard = dynamic(() => import("./roles/CollectorDashboard"), { ssr: false });
const ChefDashboard = dynamic(() => import("./roles/ChefDashboard"), { ssr: false });

export function DashboardClient({ stats }: { stats: any }) {
  const role = stats?.role || "member";

  switch (role) {
    case "admin":
      return <AdminDashboard stats={stats} />;
    case "chef_daara":
      return <ChefDashboard stats={stats} />;
    case "collector":
      return <CollectorDashboard stats={stats} />;
    default:
      return <MemberDashboard stats={stats} />;
  }
}
