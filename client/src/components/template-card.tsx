import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, MoreVertical, Copy, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TemplateCardProps {
  id: string;
  name: string;
  type: "ready-made" | "custom";
  description: string;
  usageCount: number;
  onUse?: (id: string) => void;
  onEdit?: (id: string) => void;
  onClone?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TemplateCard({
  id,
  name,
  type,
  description,
  usageCount,
  onUse,
  onEdit,
  onClone,
  onDelete,
}: TemplateCardProps) {
  const handleUse = () => {
    console.log('Use template:', id);
    onUse?.(id);
  };

  const handleEdit = () => {
    console.log('Edit template:', id);
    onEdit?.(id);
  };

  const handleClone = () => {
    console.log('Clone template:', id);
    onClone?.(id);
  };

  const handleDelete = () => {
    console.log('Delete template:', id);
    onDelete?.(id);
  };

  return (
    <Card className="hover-elevate" data-testid={`card-template-${id}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-base" data-testid={`text-template-name-${id}`}>{name}</h3>
            <Badge variant={type === "ready-made" ? "secondary" : "outline"} className="mt-1 text-xs">
              {type === "ready-made" ? "Ready-made" : "Custom"}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-template-menu-${id}`}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClone}>
              <Copy className="w-4 h-4 mr-2" />
              Clone
            </DropdownMenuItem>
            {type === "custom" && (
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        <p className="text-xs text-muted-foreground mt-3">Used {usageCount} times</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleUse} data-testid={`button-use-template-${id}`}>
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}
