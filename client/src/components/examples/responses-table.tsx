import { ResponsesTable } from "../responses-table";

const mockResponses = [
  {
    id: "1",
    recipientEmail: "john.doe@example.com",
    recipientName: "John Doe",
    subject: "Re: Spring Sale 2024",
    responseDate: "Nov 15, 2025 14:32",
    campaignName: "Spring Sale 2024",
    type: "reply" as const,
  },
  {
    id: "2",
    recipientEmail: "sarah.smith@company.com",
    recipientName: "Sarah Smith",
    subject: "Product inquiry",
    responseDate: "Nov 15, 2025 13:15",
    campaignName: "Product Launch Newsletter",
    type: "reply" as const,
  },
  {
    id: "3",
    recipientEmail: "mike.johnson@mail.com",
    recipientName: "Mike Johnson",
    subject: "Clicked: View Products",
    responseDate: "Nov 15, 2025 12:45",
    campaignName: "Spring Sale 2024",
    type: "click" as const,
  },
  {
    id: "4",
    recipientEmail: "emma.wilson@email.com",
    recipientName: "Emma Wilson",
    subject: "Survey submission",
    responseDate: "Nov 15, 2025 11:20",
    campaignName: "Customer Survey",
    type: "form-submit" as const,
  },
];

export default function ResponsesTableExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-7xl">
        <ResponsesTable responses={mockResponses} />
      </div>
    </div>
  );
}
