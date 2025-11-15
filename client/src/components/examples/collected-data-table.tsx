import { CollectedDataTable } from "../collected-data-table";

const mockCollectedData = [
  {
    id: "1",
    recipientEmail: "target@example.com",
    recipientName: "Alex Johnson",
    campaignName: "Login Portal Test",
    dataType: "credentials" as const,
    fields: {
      "username": "alex.johnson",
      "password": "********",
      "ip_address": "192.168.1.45",
    } as Record<string, string>,
    collectedDate: "Nov 15, 2025 15:23",
    status: "verified" as const,
  },
  {
    id: "2",
    recipientEmail: "user2@company.com",
    recipientName: "Maria Garcia",
    campaignName: "Survey Campaign Q4",
    dataType: "survey-response" as const,
    fields: {
      "satisfaction": "Very Satisfied",
      "recommendation": "9/10",
      "comments": "Great service!",
    } as Record<string, string>,
    collectedDate: "Nov 15, 2025 14:15",
    status: "verified" as const,
  },
  {
    id: "3",
    recipientEmail: "demo@test.com",
    recipientName: "Robert Chen",
    campaignName: "Registration Form",
    dataType: "form-data" as const,
    fields: {
      "full_name": "Robert Chen",
      "phone": "+1-555-0123",
      "company": "Tech Corp",
      "role": "Manager",
    } as Record<string, string>,
    collectedDate: "Nov 15, 2025 13:42",
    status: "pending" as const,
  },
  {
    id: "4",
    recipientEmail: "suspicious@domain.com",
    recipientName: "Unknown User",
    campaignName: "Phishing Test",
    dataType: "credentials" as const,
    fields: {
      "username": "admin",
      "password": "********",
    } as Record<string, string>,
    collectedDate: "Nov 15, 2025 12:30",
    status: "flagged" as const,
  },
];

export default function CollectedDataTableExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-7xl">
        <CollectedDataTable data={mockCollectedData} />
      </div>
    </div>
  );
}
