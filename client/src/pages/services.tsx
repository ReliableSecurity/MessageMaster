import { EmailServiceCard } from "@/components/email-service-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const mockServices = [
  { id: "1", name: "SendGrid Production", provider: "sendgrid" as const, status: "active" as const, apiKeyMasked: "SG.xxxxxxxxxxx...xxxx", lastUsed: "2 hours ago" },
  { id: "2", name: "Mailgun Backup", provider: "mailgun" as const, status: "inactive" as const, apiKeyMasked: "key-xxxxxxxxxx...xxxx", lastUsed: "5 days ago" },
  { id: "3", name: "AWS SES Main", provider: "aws-ses" as const, status: "active" as const, apiKeyMasked: "AKIA************XXXX", lastUsed: "1 hour ago" },
  { id: "4", name: "Resend Development", provider: "resend" as const, status: "active" as const, apiKeyMasked: "re_************xxxx", lastUsed: "30 minutes ago" },
];

export default function Services() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Email Services</h1>
          <p className="text-muted-foreground mt-1">Manage your email service providers</p>
        </div>
        <Button data-testid="button-add-service">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockServices.map((service) => (
          <EmailServiceCard key={service.id} {...service} />
        ))}
      </div>
    </div>
  );
}
