import { StatCard } from "../stat-card";
import { Mail, Users, Eye, MousePointerClick } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-8 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl">
        <StatCard
          title="Total Sent"
          value="12,450"
          icon={Mail}
          trend={{ value: 12.5, isPositive: true }}
          testId="stat-sent"
        />
        <StatCard
          title="Delivered"
          value="12,234"
          icon={Users}
          trend={{ value: 8.2, isPositive: true }}
          testId="stat-delivered"
        />
        <StatCard
          title="Opened"
          value="8,945"
          icon={Eye}
          trend={{ value: 3.1, isPositive: false }}
          testId="stat-opened"
        />
        <StatCard
          title="Clicked"
          value="3,256"
          icon={MousePointerClick}
          trend={{ value: 15.7, isPositive: true }}
          testId="stat-clicked"
        />
      </div>
    </div>
  );
}
