import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Mail, User, Calendar, Tag, ExternalLink } from "lucide-react";

interface ResponseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response?: {
    recipientName: string;
    recipientEmail: string;
    campaignName: string;
    subject: string;
    responseDate: string;
    type: "reply" | "click" | "form-submit";
    content?: string;
    clickedUrl?: string;
    formData?: Record<string, string>;
  };
}

export function ResponseDetailSheet({ open, onOpenChange, response }: ResponseDetailSheetProps) {
  if (!response) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Response Details</SheetTitle>
          <SheetDescription>
            Detailed information about this recipient's interaction
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Recipient</span>
            </div>
            <div className="pl-6">
              <p className="font-medium">{response.recipientName}</p>
              <p className="text-sm text-muted-foreground">{response.recipientEmail}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Campaign</span>
            </div>
            <div className="pl-6">
              <p className="text-sm">{response.campaignName}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Type</span>
            </div>
            <div className="pl-6">
              <Badge>
                {response.type === "reply" && "Email Reply"}
                {response.type === "click" && "Link Click"}
                {response.type === "form-submit" && "Form Submit"}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Date</span>
            </div>
            <div className="pl-6">
              <p className="text-sm text-muted-foreground">{response.responseDate}</p>
            </div>
          </div>

          {response.type === "reply" && response.content && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Reply Content</p>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{response.content}</p>
                </div>
              </div>
            </>
          )}

          {response.type === "click" && response.clickedUrl && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Clicked URL</p>
                <a
                  href={response.clickedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline pl-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  {response.clickedUrl}
                </a>
              </div>
            </>
          )}

          {response.type === "form-submit" && response.formData && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Submitted Data</p>
                <div className="space-y-2">
                  {Object.entries(response.formData).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => console.log('Flag response')}>
              Flag
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => console.log('Archive response')}>
              Archive
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
