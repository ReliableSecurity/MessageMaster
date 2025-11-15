import { CampaignTable } from "../campaign-table";

const mockCampaigns = [
  { id: "1", name: "Spring Sale 2024", status: "sent" as const, sent: 15420, opened: 8945, clicked: 3256, date: "Nov 10, 2025" },
  { id: "2", name: "Product Launch Newsletter", status: "scheduled" as const, sent: 0, opened: 0, clicked: 0, date: "Nov 20, 2025" },
  { id: "3", name: "Weekly Update #47", status: "sending" as const, sent: 8234, opened: 2145, clicked: 456, date: "Nov 15, 2025" },
  { id: "4", name: "Customer Survey", status: "draft" as const, sent: 0, opened: 0, clicked: 0, date: "Nov 12, 2025" },
  { id: "5", name: "Black Friday Preview", status: "sent" as const, sent: 22100, opened: 15234, clicked: 8945, date: "Nov 8, 2025" },
];

export default function CampaignTableExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-7xl">
        <CampaignTable campaigns={mockCampaigns} />
      </div>
    </div>
  );
}
