import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Mail, Send, Clock, CheckCircle2, XCircle, Pause, MoreHorizontal, Eye, Copy, Trash2, Play, UserCheck, Globe, Server, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Campaign, Template, LandingPage, EmailService, ContactGroup } from "@shared/schema";

const statusConfig = {
  draft: { label: "Черновик", variant: "secondary" as const, icon: Clock },
  scheduled: { label: "Запланирована", variant: "outline" as const, icon: Clock },
  sending: { label: "Отправляется", variant: "default" as const, icon: Send },
  sent: { label: "Отправлена", variant: "default" as const, icon: CheckCircle2 },
  paused: { label: "Приостановлена", variant: "secondary" as const, icon: Pause },
  cancelled: { label: "Отменена", variant: "destructive" as const, icon: XCircle },
};

const campaignFormSchema = z.object({
  name: z.string().min(2, "Название должно быть минимум 2 символа"),
  templateId: z.string().min(1, "Выберите шаблон"),
  landingPageId: z.string().min(1, "Выберите фишинг-страницу"),
  emailServiceId: z.string().min(1, "Выберите профиль отправки"),
  contactGroupId: z.string().min(1, "Выберите группу контактов"),
  url: z.string().url("Введите корректный URL").optional().or(z.literal("")),
});

type CampaignFormData = z.infer<typeof campaignFormSchema>;

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: templates } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const { data: landingPages } = useQuery<LandingPage[]>({
    queryKey: ["/api/landing-pages"],
  });

  const { data: emailServices } = useQuery<EmailService[]>({
    queryKey: ["/api/email-services"],
  });

  const { data: contactGroups } = useQuery<ContactGroup[]>({
    queryKey: ["/api/contact-groups"],
  });

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      templateId: "",
      landingPageId: "",
      emailServiceId: "",
      contactGroupId: "",
      url: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignFormData) => 
      apiRequest("POST", "/api/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Кампания создана", description: "Новая кампания успешно создана" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать кампанию", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Кампания удалена" });
    },
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/campaigns/${id}/launch`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Кампания запущена", description: "Начинается отправка писем" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось запустить кампанию", variant: "destructive" });
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    createMutation.mutate(data);
  };

  useEffect(() => {
    if (!isCreateDialogOpen) {
      form.reset();
    }
  }, [isCreateDialogOpen, form]);

  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Кампании</h1>
          <p className="text-muted-foreground mt-1">Управление фишинг-кампаниями</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-campaign">
              <Plus className="w-4 h-4 mr-2" />
              Создать кампанию
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Новая кампания</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название кампании</FormLabel>
                      <FormControl>
                        <Input placeholder="Фишинг-тест Q1 2024" {...field} data-testid="input-campaign-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Шаблон письма</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-template">
                            <SelectValue placeholder="Выберите шаблон" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates?.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                {template.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Шаблон email для рассылки</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="landingPageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фишинг-страница</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-landing-page">
                            <SelectValue placeholder="Выберите страницу" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {landingPages?.map(page => (
                            <SelectItem key={page.id} value={page.id}>
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                {page.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Страница для захвата учётных данных</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailServiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Профиль отправки</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-sending-profile">
                            <SelectValue placeholder="Выберите профиль" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {emailServices?.filter(s => s.isActive).map(service => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-muted-foreground" />
                                {service.name} ({service.provider})
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>SMTP сервис для отправки писем</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactGroupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Группа контактов</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contact-group">
                            <SelectValue placeholder="Выберите группу" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contactGroups?.map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                {group.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Получатели фишинг-писем</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL кампании (опционально)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://phish.example.com" {...field} data-testid="input-campaign-url" />
                      </FormControl>
                      <FormDescription>Базовый URL для трекинга</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" data-testid="button-cancel-campaign">
                      Отмена
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-campaign">
                    {createMutation.isPending ? "Создание..." : "Создать"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="stat-total-campaigns">{stats.total}</p>
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
                <p className="text-2xl font-semibold" data-testid="stat-draft-campaigns">{stats.draft}</p>
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
                <p className="text-2xl font-semibold" data-testid="stat-sending-campaigns">{stats.sending}</p>
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
                <p className="text-2xl font-semibold" data-testid="stat-sent-campaigns">{stats.sent}</p>
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
          <TabsTrigger value="all" data-testid="tab-all">Все</TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">Черновики</TabsTrigger>
          <TabsTrigger value="scheduled" data-testid="tab-scheduled">Запланированные</TabsTrigger>
          <TabsTrigger value="sending" data-testid="tab-sending">Отправляются</TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">Отправленные</TabsTrigger>
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
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                    data-testid="button-create-first-campaign"
                  >
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
                      const submitRate = campaign.clickedCount > 0
                        ? Math.round((campaign.submittedDataCount / campaign.clickedCount) * 100)
                        : 0;

                      return (
                        <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>{campaign.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {campaign.totalRecipients} получателей
                                </p>
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
                            <div className="text-sm space-y-0.5">
                              <p>Открытия: <span className="font-medium">{openRate}%</span></p>
                              <p className="text-muted-foreground">Клики: {clickRate}%</p>
                              <p className="text-muted-foreground">Ввод данных: {submitRate}%</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {campaign.completedDate 
                                ? format(new Date(campaign.completedDate), "d MMM yyyy", { locale: ru })
                                : campaign.launchDate
                                  ? format(new Date(campaign.launchDate), "d MMM yyyy", { locale: ru })
                                  : format(new Date(campaign.createdAt), "d MMM yyyy", { locale: ru })
                              }
                            </p>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-campaign-menu-${campaign.id}`}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem data-testid={`button-view-campaign-${campaign.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Просмотр
                                </DropdownMenuItem>
                                <DropdownMenuItem data-testid={`button-copy-campaign-${campaign.id}`}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Дублировать
                                </DropdownMenuItem>
                                {campaign.status === "draft" && (
                                  <DropdownMenuItem 
                                    onClick={() => launchMutation.mutate(campaign.id)}
                                    data-testid={`button-launch-campaign-${campaign.id}`}
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Запустить
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => deleteMutation.mutate(campaign.id)}
                                  className="text-destructive"
                                  data-testid={`button-delete-campaign-${campaign.id}`}
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
