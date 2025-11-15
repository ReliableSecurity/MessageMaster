import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailResponse {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  responseDate: string;
  campaignName: string;
  type: "reply" | "click" | "form-submit";
}

interface ResponsesTableProps {
  responses: EmailResponse[];
  onView?: (id: string) => void;
}

const typeConfig = {
  reply: { label: "Email Reply", variant: "default" as const },
  click: { label: "Link Click", variant: "secondary" as const },
  "form-submit": { label: "Form Submit", variant: "default" as const },
};

export function ResponsesTable({ responses, onView }: ResponsesTableProps) {
  const handleView = (id: string) => {
    console.log('View response:', id);
    onView?.(id);
  };

  const handleExport = () => {
    console.log('Export responses to CSV');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Email Responses</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-responses">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response) => (
                <TableRow key={response.id} data-testid={`row-response-${response.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{response.recipientName}</p>
                      <p className="text-xs text-muted-foreground">{response.recipientEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{response.campaignName}</TableCell>
                  <TableCell>
                    <Badge variant={typeConfig[response.type].variant} data-testid={`badge-type-${response.id}`}>
                      {typeConfig[response.type].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{response.subject}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{response.responseDate}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(response.id)}
                      data-testid={`button-view-${response.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
