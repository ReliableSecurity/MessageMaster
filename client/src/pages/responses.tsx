import { useState } from "react";
import { ResponsesTable } from "@/components/responses-table";
import { CollectedDataTable } from "@/components/collected-data-table";
import { ResponseDetailSheet } from "@/components/response-detail-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Mail, MousePointerClick, FormInput, AlertCircle } from "lucide-react";

const mockResponses = [
  {
    id: "1",
    recipientEmail: "john.doe@example.com",
    recipientName: "John Doe",
    subject: "Re: Spring Sale 2024",
    responseDate: "Nov 15, 2025 14:32",
    campaignName: "Spring Sale 2024",
    type: "reply" as const,
    content: "Hi,\n\nThank you for the offer! I'm very interested in the spring sale products.",
  },
  {
    id: "2",
    recipientEmail: "sarah.smith@company.com",
    recipientName: "Sarah Smith",
    subject: "Product inquiry",
    responseDate: "Nov 15, 2025 13:15",
    campaignName: "Product Launch Newsletter",
    type: "reply" as const,
    content: "Could you send me more details about the new product line?",
  },
  {
    id: "3",
    recipientEmail: "mike.johnson@mail.com",
    recipientName: "Mike Johnson",
    subject: "Clicked: View Products",
    responseDate: "Nov 15, 2025 12:45",
    campaignName: "Spring Sale 2024",
    type: "click" as const,
    clickedUrl: "https://example.com/products/spring-collection",
  },
  {
    id: "4",
    recipientEmail: "emma.wilson@email.com",
    recipientName: "Emma Wilson",
    subject: "Survey submission",
    responseDate: "Nov 15, 2025 11:20",
    campaignName: "Customer Survey",
    type: "form-submit" as const,
    formData: {
      satisfaction: "Very Satisfied",
      recommendation: "9/10",
    },
  },
];

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

export default function Responses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<typeof mockResponses[0] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleViewResponse = (id: string) => {
    const response = mockResponses.find(r => r.id === id);
    if (response) {
      setSelectedResponse(response);
      setSheetOpen(true);
    }
  };

  const filteredResponses = mockResponses.filter((response) =>
    response.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    response.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    response.campaignName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredData = mockCollectedData.filter((entry) =>
    entry.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.campaignName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Responses & Data</h1>
        <p className="text-muted-foreground mt-1">Track email replies and collected information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Responses"
          value="147"
          icon={Mail}
          trend={{ value: 23.5, isPositive: true }}
          testId="stat-responses"
        />
        <StatCard
          title="Link Clicks"
          value="89"
          icon={MousePointerClick}
          trend={{ value: 15.2, isPositive: true }}
          testId="stat-clicks"
        />
        <StatCard
          title="Form Submissions"
          value="34"
          icon={FormInput}
          trend={{ value: 8.3, isPositive: true }}
          testId="stat-forms"
        />
        <StatCard
          title="Flagged Items"
          value="5"
          icon={AlertCircle}
          trend={{ value: 2.1, isPositive: false }}
          testId="stat-flagged"
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by recipient, campaign..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
          data-testid="input-search-responses"
        />
      </div>

      <Tabs defaultValue="responses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="responses" data-testid="tab-responses">
            Email Responses
          </TabsTrigger>
          <TabsTrigger value="collected-data" data-testid="tab-collected-data">
            Collected Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="responses">
          <ResponsesTable responses={filteredResponses} onView={handleViewResponse} />
        </TabsContent>

        <TabsContent value="collected-data">
          <CollectedDataTable data={filteredData} />
        </TabsContent>
      </Tabs>

      <ResponseDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        response={selectedResponse || undefined}
      />
    </div>
  );
}
