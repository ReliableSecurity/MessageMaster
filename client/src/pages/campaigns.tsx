import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Mail, Send, Clock, CheckCircle2, XCircle, Pause, MoreHorizontal, Eye, Copy, Trash2, Play } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Campaign } from "@shared/schema";

const statusConfig = {
  draft: { label: "Черновик", variant: "secondary" as const, icon: Clock },
  scheduled: { label: "Запланирована", variant: "outline" as const, icon: Clock },
  sending: { label: "Отправляется", variant: "default" as const, icon: Send },
  sent: { label: "Отправлена", variant: "default" as const, icon: CheckCircle2 },
  paused: { label: "Приостановлена", variant: "secondary" as const, icon: Pause },
  cancelled: { label: "Отменена", variant: "destructive" as const, icon: XCircle },
};

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/campaigns/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Кампания удалена" });
    },
  });

  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && campaign.status === activeTab;
  }) || [];

  const getStats = () => {
    if (!campaigns) return { total: 0, draft: 0, sending: 0, sent: 0 };
    return {
      total: campaigns.length,
      draft: campaigns.filter(c => c.status === "draft").length,
      sending: campaigns.filter(c => c.status === "sending").length,
      sent: campaigns.filter(c => c.status === "sent").length,
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Кампании</h1>
          <p className="text-muted-foreground mt-1">Управление email-кампаниями</p>
        </div>
        <Button data-testid="button-create-campaign">
          <Plus className="w-4 h-4 mr-2" />
          Создать кампанию
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Всего кампаний</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.draft}</p>
                <p className="text-sm text-muted-foreground">Черновики</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.sending}</p>
                <p className="text-sm text-muted-foreground">Отправляются</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">Отправлены</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск кампаний..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-campaigns"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="draft">Черновики</TabsTrigger>
          <TabsTrigger value="scheduled">Запланированные</TabsTrigger>
          <TabsTrigger value="sending">Отправляются</TabsTrigger>
          <TabsTrigger value="sent">Отправленные</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Кампании</CardTitle>
              <CardDescription>
                {isLoading ? "Загрузка..." : `${filteredCampaigns.length} кампаний`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Кампании не найдены</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Создать первую кампанию
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Кампания</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Прогресс</TableHead>
                      <TableHead>Статистика</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => {
                      const status = statusConfig[campaign.status];
                      const StatusIcon = status.icon;
                      const progress = campaign.totalRecipients > 0 
                        ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100) 
                        : 0;
                      const openRate = campaign.sentCount > 0
                        ? Math.round((campaign.openedCount / campaign.sentCount) * 100)
                        : 0;
                      const clickRate = campaign.openedCount > 0
                        ? Math.round((campaign.clickedCount / campaign.openedCount) * 100)
                        : 0;

                      return (
                        <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{campaign.name}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">{campaign.subject}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-32">
                              <Progress value={progress} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">
                                {campaign.sentCount.toLocaleString()} / {campaign.totalRecipients.toLocaleString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>Открытия: {openRate}%</p>
                              <p className="text-muted-foreground">Клики: {clickRate}%</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {campaign.sentAt 
                                ? format(new Date(campaign.sentAt), "d MMM yyyy", { locale: ru })
                                : campaign.scheduledFor
                                  ? format(new Date(campaign.scheduledFor), "d MMM yyyy", { locale: ru })
                                  : format(new Date(campaign.createdAt), "d MMM yyyy", { locale: ru })
                              }
                            </p>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Просмотр
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Дублировать
                                </DropdownMenuItem>
                                {campaign.status === "draft" && (
                                  <DropdownMenuItem>
                                    <Play className="w-4 h-4 mr-2" />
                                    Запустить
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => deleteMutation.mutate(campaign.id)}
                                  className="text-destructive"
                                >
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
