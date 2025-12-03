import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface EmailServiceCardProps {
  id: string;
  name: string;
  provider: "sendgrid" | "mailgun" | "aws-ses" | "resend";
  status: "active" | "inactive";
  apiKeyMasked: string;
  lastUsed?: string;
  onConfigure?: (id: string) => void;
  onTest?: (id: string) => void;
}

const providerLogos = {
  sendgrid: "SG",
  mailgun: "MG",
  "aws-ses": "AWS",
  resend: "RS",
};

const statusLabels = {
  active: "Активен",
  inactive: "Неактивен",
};

export function EmailServiceCard({
  id,
  name,
  provider,
  status,
  apiKeyMasked,
  lastUsed,
  onConfigure,
  onTest,
}: EmailServiceCardProps) {
  const handleConfigure = () => {
    console.log('Configure service:', id);
    onConfigure?.(id);
  };

  const handleTest = () => {
    console.log('Test service:', id);
    onTest?.(id);
  };

  return (
    <Card data-testid={`card-service-${id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-mono font-semibold text-sm">
            {providerLogos[provider]}
          </div>
          <div>
            <h3 className="font-medium text-base" data-testid={`text-service-name-${id}`}>{name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{provider.replace("-", " ")}</p>
          </div>
        </div>
        <Badge
          variant={status === "active" ? "default" : "secondary"}
          className="gap-1"
          data-testid={`badge-status-${id}`}
        >
          {status === "active" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          {statusLabels[status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">API Ключ</p>
          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{apiKeyMasked}</code>
        </div>
        {lastUsed && (
          <p className="text-xs text-muted-foreground">Последнее использование: {lastUsed}</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleConfigure} data-testid={`button-configure-${id}`}>
          Настроить
        </Button>
        <Button variant="secondary" className="flex-1" onClick={handleTest} data-testid={`button-test-${id}`}>
          Проверить
        </Button>
      </CardFooter>
    </Card>
  );
}
