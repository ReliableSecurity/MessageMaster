import { CampaignPerformanceChart } from "../campaign-performance-chart";

const mockData = [
  { date: "Nov 1", opened: 1200, clicked: 450 },
  { date: "Nov 3", opened: 1850, clicked: 680 },
  { date: "Nov 5", opened: 2100, clicked: 820 },
  { date: "Nov 7", opened: 1950, clicked: 750 },
  { date: "Nov 9", opened: 2450, clicked: 980 },
  { date: "Nov 11", opened: 2800, clicked: 1150 },
  { date: "Nov 13", opened: 2650, clicked: 1050 },
  { date: "Nov 15", opened: 3200, clicked: 1350 },
];

export default function CampaignPerformanceChartExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-4xl">
        <CampaignPerformanceChart data={mockData} />
      </div>
    </div>
  );
}
