import { useState } from "react";
import { ResponseDetailSheet } from "../response-detail-sheet";
import { Button } from "@/components/ui/button";

export default function ResponseDetailSheetExample() {
  const [open, setOpen] = useState(false);

  const mockResponse = {
    recipientName: "John Doe",
    recipientEmail: "john.doe@example.com",
    campaignName: "Spring Sale 2024",
    subject: "Re: Spring Sale 2024",
    responseDate: "Nov 15, 2025 14:32",
    type: "reply" as const,
    content: "Hi,\n\nThank you for the offer! I'm very interested in the spring sale products. Could you please provide more information about the shipping options?\n\nBest regards,\nJohn",
  };

  return (
    <div className="p-8 bg-background flex items-center justify-center">
      <Button onClick={() => setOpen(true)} data-testid="button-open-sheet">
        View Response Details
      </Button>
      <ResponseDetailSheet
        open={open}
        onOpenChange={setOpen}
        response={mockResponse}
      />
    </div>
  );
}
