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
import { Copy, Eye, Download, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface CollectedDataEntry {
  id: string;
  recipientEmail: string;
  recipientName: string;
  campaignName: string;
  dataType: "credentials" | "form-data" | "survey-response";
  fields: Record<string, string>;
  collectedDate: string;
  status: "verified" | "pending" | "flagged";
}

interface CollectedDataTableProps {
  data: CollectedDataEntry[];
  onView?: (id: string) => void;
}

const statusConfig = {
  verified: { label: "Проверено", variant: "default" as const },
  pending: { label: "Ожидание", variant: "secondary" as const },
  flagged: { label: "Помечено", variant: "destructive" as const },
};

const dataTypeLabels = {
  credentials: "Учетные данные",
  "form-data": "Данные формы",
  "survey-response": "Ответ на опрос",
};

export function CollectedDataTable({ data, onView }: CollectedDataTableProps) {
  const { toast } = useToast();

  const handleView = (id: string) => {
    console.log('View collected data:', id);
    onView?.(id);
  };

  const handleCopyData = (fields: Record<string, string>) => {
    const text = Object.entries(fields)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Данные скопированы в буфер обмена",
    });
    console.log('Copied data:', fields);
  };

  const handleExport = () => {
    console.log('Export collected data to CSV');
    toast({
      title: "Экспорт начат",
      description: "Данные подготавливаются для скачивания",
    });
  };

  const getFieldsText = (count: number) => {
    if (count === 1) return "поле собрано";
    if (count >= 2 && count <= 4) return "поля собрано";
    return "полей собрано";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-lg">Собранные данные</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-data">
          <Download className="w-4 h-4 mr-2" />
          Экспорт всех
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Получатель</TableHead>
                <TableHead>Кампания</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Поля</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry) => (
                <TableRow key={entry.id} data-testid={`row-data-${entry.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{entry.recipientName}</p>
                      <p className="text-xs text-muted-foreground">{entry.recipientEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{entry.campaignName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dataTypeLabels[entry.dataType]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {Object.keys(entry.fields).length} {getFieldsText(Object.keys(entry.fields).length)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[entry.status].variant} data-testid={`badge-status-${entry.id}`}>
                      {statusConfig[entry.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.collectedDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(entry.id)}
                        data-testid={`button-view-${entry.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyData(entry.fields)}
                        data-testid={`button-copy-${entry.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
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
