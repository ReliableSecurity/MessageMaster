import { Mail, Users, Eye, MousePointerClick } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { CampaignTable } from "@/components/campaign-table";
import { CampaignPerformanceChart } from "@/components/campaign-performance-chart";
import { TopLinksTable } from "@/components/top-links-table";
import { NewCampaignDialog } from "@/components/new-campaign-dialog";

const mockCampaigns = [
  { id: "1", name: "Spring Sale 2024", status: "sent" as const, sent: 15420, opened: 8945, clicked: 3256, date: "Nov 10, 2025" },
  { id: "2", name: "Product Launch Newsletter", status: "scheduled" as const, sent: 0, opened: 0, clicked: 0, date: "Nov 20, 2025" },
  { id: "3", name: "Weekly Update #47", status: "sending" as const, sent: 8234, opened: 2145, clicked: 456, date: "Nov 15, 2025" },
  { id: "4", name: "Customer Survey", status: "draft" as const, sent: 0, opened: 0, clicked: 0, date: "Nov 12, 2025" },
];

const mockChartData = [
  { date: "Nov 1", opened: 1200, clicked: 450 },
  { date: "Nov 3", opened: 1850, clicked: 680 },
  { date: "Nov 5", opened: 2100, clicked: 820 },
  { date: "Nov 7", opened: 1950, clicked: 750 },
  { date: "Nov 9", opened: 2450, clicked: 980 },
  { date: "Nov 11", opened: 2800, clicked: 1150 },
  { date: "Nov 13", opened: 2650, clicked: 1050 },
  { date: "Nov 15", opened: 3200, clicked: 1350 },
];

const mockLinks = [
  { url: "https://example.com/spring-sale", clicks: 1245, uniqueClicks: 892 },
  { url: "https://example.com/new-products", clicks: 987, uniqueClicks: 743 },
  { url: "https://example.com/blog/latest", clicks: 654, uniqueClicks: 512 },
  { url: "https://example.com/pricing", clicks: 432, uniqueClicks: 389 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your email campaigns</p>
        </div>
        <NewCampaignDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CampaignPerformanceChart data={mockChartData} />
        <TopLinksTable links={mockLinks} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Campaigns</h2>
        <CampaignTable campaigns={mockCampaigns} />
      </div>
    </div>
  );
}
