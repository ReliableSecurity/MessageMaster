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
import { MoreVertical, Eye, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  name: string;
  status: "sent" | "scheduled" | "draft" | "sending";
  sent: number;
  opened: number;
  clicked: number;
  date: string;
}

interface CampaignTableProps {
  campaigns: Campaign[];
  onView?: (id: string) => void;
  onClone?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusVariants = {
  sent: "default",
  scheduled: "secondary",
  draft: "outline",
  sending: "default",
} as const;

export function CampaignTable({ campaigns, onView, onClone, onDelete }: CampaignTableProps) {
  const handleView = (id: string) => {
    console.log('View campaign:', id);
    onView?.(id);
  };

  const handleClone = (id: string) => {
    console.log('Clone campaign:', id);
    onClone?.(id);
  };

  const handleDelete = (id: string) => {
    console.log('Delete campaign:', id);
    onDelete?.(id);
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Sent</TableHead>
            <TableHead className="text-right">Opened</TableHead>
            <TableHead className="text-right">Clicked</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : '0.0';
            const clickRate = campaign.sent > 0 ? ((campaign.clicked / campaign.sent) * 100).toFixed(1) : '0.0';

            return (
              <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[campaign.status]} data-testid={`badge-status-${campaign.id}`}>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{campaign.sent.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {campaign.opened.toLocaleString()} <span className="text-xs text-muted-foreground">({openRate}%)</span>
                </TableCell>
                <TableCell className="text-right">
                  {campaign.clicked.toLocaleString()} <span className="text-xs text-muted-foreground">({clickRate}%)</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{campaign.date}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-actions-${campaign.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(campaign.id)} data-testid={`action-view-${campaign.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleClone(campaign.id)} data-testid={`action-clone-${campaign.id}`}>
                        <Copy className="w-4 h-4 mr-2" />
                        Clone Campaign
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(campaign.id)} 
                        className="text-destructive"
                        data-testid={`action-delete-${campaign.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
