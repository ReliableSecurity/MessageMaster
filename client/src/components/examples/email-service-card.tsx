import { EmailServiceCard } from "../email-service-card";

export default function EmailServiceCardExample() {
  return (
    <div className="p-8 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
        <EmailServiceCard
          id="1"
          name="SendGrid Production"
          provider="sendgrid"
          status="active"
          apiKeyMasked="SG.xxxxxxxxxxx...xxxx"
          lastUsed="2 hours ago"
        />
        <EmailServiceCard
          id="2"
          name="Mailgun Backup"
          provider="mailgun"
          status="inactive"
          apiKeyMasked="key-xxxxxxxxxx...xxxx"
          lastUsed="5 days ago"
        />
        <EmailServiceCard
          id="3"
          name="AWS SES Main"
          provider="aws-ses"
          status="active"
          apiKeyMasked="AKIA************XXXX"
          lastUsed="1 hour ago"
        />
      </div>
    </div>
  );
}
