import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  Eye, 
  MousePointer, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Users,
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  Target,
  Send,
  FileText,
  Globe,
  Server
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { format, formatDistanceToNow } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import type { Campaign, CampaignRecipient, CollectedData, Template, LandingPage, EmailService, ContactGroup, Contact } from "@shared/schema";

interface RecipientWithContact extends CampaignRecipient {
  contact?: Contact;
}

interface CampaignStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  submitted: number;
  sentPercent: number;
  openedPercent: number;
  clickedPercent: number;
  submittedPercent: number;
}

const statusConfig = {
  pending: { label: "Ожидает", labelEn: "Pending", color: "bg-gray-500", icon: Clock },
  sent: { label: "Отправлено", labelEn: "Sent", color: "bg-blue-500", icon: Mail },
  opened: { label: "Открыто", labelEn: "Opened", color: "bg-yellow-500", icon: Eye },
  clicked: { label: "Переход", labelEn: "Clicked", color: "bg-orange-500", icon: MousePointer },
  submitted_data: { label: "Данные введены", labelEn: "Data Submitted", color: "bg-red-500", icon: KeyRound },
};

const campaignStatusConfig = {
  draft: { label: "Черновик", labelEn: "Draft", variant: "secondary" as const },
  scheduled: { label: "Запланирована", labelEn: "Scheduled", variant: "outline" as const },
  sending: { label: "Отправляется", labelEn: "In Progress", variant: "default" as const },
  sent: { label: "Завершена", labelEn: "Completed", variant: "default" as const },
  paused: { label: "Приостановлена", labelEn: "Paused", variant: "secondary" as const },
  cancelled: { label: "Отменена", labelEn: "Cancelled", variant: "destructive" as const },
};

export default function CampaignResults() {
  const [, params] = useRoute("/campaigns/:id");
  const campaignId = params?.id;
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const dateLocale = language === "ru" ? ru : enUS;

  const { data: campaign, isLoading: campaignLoading, error: campaignError } = useQuery<Campaign>({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: () => fetch(`/api/campaigns/${campaignId}`).then(r => r.ok ? r.json() : Promise.reject(r)),
    enabled: !!campaignId,
  });

  const { data: recipients = [], isLoading: recipientsLoading, error: recipientsError } = useQuery<RecipientWithContact[]>({
    queryKey: ["/api/campaign-recipients", campaignId],
    queryFn: () => fetch(`/api/campaign-recipients/${campaignId}`).then(r => r.ok ? r.json() : Promise.reject(r)),
    enabled: !!campaignId,
  });

  const { data: collectedData = [], isLoading: collectedDataLoading, error: collectedDataError } = useQuery<CollectedData[]>({
    queryKey: ["/api/collected-data", campaignId],
    queryFn: () => fetch(`/api/collected-data?campaignId=${campaignId}`).then(r => r.ok ? r.json() : Promise.reject(r)),
    enabled: !!campaignId,
  });

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const { data: landingPages = [] } = useQuery<LandingPage[]>({
    queryKey: ["/api/landing-pages"],
  });

  const { data: emailServices = [] } = useQuery<EmailService[]>({
    queryKey: ["/api/email-services"],
  });

  const { data: contactGroups = [] } = useQuery<ContactGroup[]>({
    queryKey: ["/api/contact-groups"],
  });

  const template = templates.find(t => t.id === campaign?.templateId);
  const landingPage = landingPages.find(lp => lp.id === campaign?.landingPageId);
  const emailService = emailServices.find(es => es.id === campaign?.emailServiceId);
  const contactGroup = contactGroups.find(cg => cg.id === campaign?.contactGroupId);

  const stats: CampaignStats = {
    total: recipients.length,
    sent: recipients.filter(r => r.status !== "pending").length,
    opened: recipients.filter(r => ["opened", "clicked", "submitted_data"].includes(r.status)).length,
    clicked: recipients.filter(r => ["clicked", "submitted_data"].includes(r.status)).length,
    submitted: recipients.filter(r => r.status === "submitted_data").length,
    sentPercent: recipients.length > 0 ? (recipients.filter(r => r.status !== "pending").length / recipients.length) * 100 : 0,
    openedPercent: recipients.length > 0 ? (recipients.filter(r => ["opened", "clicked", "submitted_data"].includes(r.status)).length / recipients.length) * 100 : 0,
    clickedPercent: recipients.length > 0 ? (recipients.filter(r => ["clicked", "submitted_data"].includes(r.status)).length / recipients.length) * 100 : 0,
    submittedPercent: recipients.length > 0 ? (recipients.filter(r => r.status === "submitted_data").length / recipients.length) * 100 : 0,
  };

  const timeline = recipients
    .filter(r => r.sentAt || r.openedAt || r.clickedAt || r.submittedDataAt)
    .flatMap(r => {
      const events = [];
      if (r.sentAt) events.push({ type: "sent", time: new Date(r.sentAt), recipient: r });
      if (r.openedAt) events.push({ type: "opened", time: new Date(r.openedAt), recipient: r });
      if (r.clickedAt) events.push({ type: "clicked", time: new Date(r.clickedAt), recipient: r });
      if (r.submittedDataAt) events.push({ type: "submitted_data", time: new Date(r.submittedDataAt), recipient: r });
      return events;
    })
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 50);

  if (campaignLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {language === "ru" ? "Кампания не найдена" : "Campaign not found"}
        </h2>
        <Link href="/campaigns">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === "ru" ? "Назад к кампаниям" : "Back to campaigns"}
          </Button>
        </Link>
      </div>
    );
  }

  const campaignStatus = campaignStatusConfig[campaign.status as keyof typeof campaignStatusConfig] || campaignStatusConfig.draft;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold" data-testid="text-campaign-name">{campaign.name}</h1>
              <Badge variant={campaignStatus.variant}>
                {language === "ru" ? campaignStatus.label : campaignStatus.labelEn}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {language === "ru" ? "Результаты кампании" : "Campaign Results"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchRecipients()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            {language === "ru" ? "Обновить" : "Refresh"}
          </Button>
          <Button variant="outline" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            {language === "ru" ? "Экспорт" : "Export"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ru" ? "Отправлено" : "Sent"}</p>
                <p className="text-3xl font-bold text-blue-500">{stats.sent}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <Progress value={stats.sentPercent} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{stats.sentPercent.toFixed(1)}% {language === "ru" ? "от всех" : "of total"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ru" ? "Открыто" : "Opened"}</p>
                <p className="text-3xl font-bold text-yellow-500">{stats.opened}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Eye className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <Progress value={stats.openedPercent} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{stats.openedPercent.toFixed(1)}% {language === "ru" ? "от всех" : "of total"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ru" ? "Переходы" : "Clicked"}</p>
                <p className="text-3xl font-bold text-orange-500">{stats.clicked}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <Progress value={stats.clickedPercent} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{stats.clickedPercent.toFixed(1)}% {language === "ru" ? "от всех" : "of total"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ru" ? "Введены данные" : "Submitted"}</p>
                <p className="text-3xl font-bold text-red-500">{stats.submitted}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <Progress value={stats.submittedPercent} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{stats.submittedPercent.toFixed(1)}% {language === "ru" ? "от всех" : "of total"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            {language === "ru" ? "Обзор" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="recipients" className="gap-2">
            <Users className="w-4 h-4" />
            {language === "ru" ? "Получатели" : "Recipients"} ({recipients.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="w-4 h-4" />
            {language === "ru" ? "Хронология" : "Timeline"}
          </TabsTrigger>
          <TabsTrigger value="submitted" className="gap-2">
            <KeyRound className="w-4 h-4" />
            {language === "ru" ? "Введённые данные" : "Submitted Data"} ({collectedData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "ru" ? "Информация о кампании" : "Campaign Details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ru" ? "Дата создания" : "Created"}</p>
                    <p className="font-medium">
                      {campaign.createdAt ? format(new Date(campaign.createdAt), "d MMM yyyy, HH:mm", { locale: dateLocale }) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ru" ? "Дата запуска" : "Launched"}</p>
                    <p className="font-medium">
                      {campaign.launchDate ? format(new Date(campaign.launchDate), "d MMM yyyy, HH:mm", { locale: dateLocale }) : "-"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ru" ? "Шаблон письма" : "Email Template"}</p>
                      <p className="font-medium">{template?.name || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ru" ? "Фишинг-страница" : "Landing Page"}</p>
                      <p className="font-medium">{landingPage?.name || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ru" ? "SMTP профиль" : "Sending Profile"}</p>
                      <p className="font-medium">{emailService?.name || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ru" ? "Группа контактов" : "Contact Group"}</p>
                      <p className="font-medium">{contactGroup?.name || "-"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "ru" ? "Воронка конверсии" : "Conversion Funnel"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">{language === "ru" ? "Отправлено" : "Sent"}</p>
                        <p className="text-sm text-muted-foreground">{stats.sent} {language === "ru" ? "писем" : "emails"}</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-500">{stats.sentPercent.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <Eye className="w-5 h-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className="font-medium">{language === "ru" ? "Открыто" : "Opened"}</p>
                        <p className="text-sm text-muted-foreground">{stats.opened} {language === "ru" ? "писем" : "emails"}</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-500">{stats.openedPercent.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <MousePointer className="w-5 h-5 text-orange-500" />
                      <div className="flex-1">
                        <p className="font-medium">{language === "ru" ? "Переходы" : "Clicked"}</p>
                        <p className="text-sm text-muted-foreground">{stats.clicked} {language === "ru" ? "переходов" : "clicks"}</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-500">{stats.clickedPercent.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <KeyRound className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium">{language === "ru" ? "Введены данные" : "Submitted Data"}</p>
                        <p className="text-sm text-muted-foreground">{stats.submitted} {language === "ru" ? "отправок" : "submissions"}</p>
                      </div>
                      <p className="text-2xl font-bold text-red-500">{stats.submittedPercent.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recipients" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ru" ? "Получатели кампании" : "Campaign Recipients"}</CardTitle>
              <CardDescription>
                {language === "ru" 
                  ? `Всего ${recipients.length} получателей` 
                  : `Total ${recipients.length} recipients`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recipientsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : recipients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ru" ? "Нет получателей" : "No recipients"}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ru" ? "Получатель" : "Recipient"}</TableHead>
                      <TableHead>{language === "ru" ? "Статус" : "Status"}</TableHead>
                      <TableHead>{language === "ru" ? "Отправлено" : "Sent"}</TableHead>
                      <TableHead>{language === "ru" ? "Открыто" : "Opened"}</TableHead>
                      <TableHead>{language === "ru" ? "Переход" : "Clicked"}</TableHead>
                      <TableHead>{language === "ru" ? "Данные" : "Submitted"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.map((recipient) => {
                      const status = statusConfig[recipient.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={recipient.id} data-testid={`row-recipient-${recipient.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {(recipient.contact?.firstName?.[0] || "").toUpperCase()}
                                  {(recipient.contact?.lastName?.[0] || "").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {recipient.contact?.firstName} {recipient.contact?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{recipient.contact?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {language === "ru" ? status.label : status.labelEn}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {recipient.sentAt ? (
                              <div className="flex items-center gap-1 text-green-500">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs">
                                  {format(new Date(recipient.sentAt), "HH:mm", { locale: dateLocale })}
                                </span>
                              </div>
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            {recipient.openedAt ? (
                              <div className="flex items-center gap-1 text-yellow-500">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs">
                                  {format(new Date(recipient.openedAt), "HH:mm", { locale: dateLocale })}
                                </span>
                              </div>
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            {recipient.clickedAt ? (
                              <div className="flex items-center gap-1 text-orange-500">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs">
                                  {format(new Date(recipient.clickedAt), "HH:mm", { locale: dateLocale })}
                                </span>
                              </div>
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            {recipient.submittedDataAt ? (
                              <div className="flex items-center gap-1 text-red-500">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs">
                                  {format(new Date(recipient.submittedDataAt), "HH:mm", { locale: dateLocale })}
                                </span>
                              </div>
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            )}
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

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ru" ? "Хронология событий" : "Event Timeline"}</CardTitle>
              <CardDescription>
                {language === "ru" ? "Последние 50 событий" : "Last 50 events"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ru" ? "Нет событий" : "No events yet"}</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {timeline.map((event, index) => {
                      const status = statusConfig[event.type as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div key={index} className="flex gap-4 items-start">
                          <div className={`w-10 h-10 rounded-full ${status.color}/10 flex items-center justify-center flex-shrink-0`}>
                            <StatusIcon className={`w-5 h-5 ${status.color.replace('bg-', 'text-')}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {event.recipient.contact?.firstName} {event.recipient.contact?.lastName}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {language === "ru" ? status.label : status.labelEn}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.recipient.contact?.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(event.time, { addSuffix: true, locale: dateLocale })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submitted" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ru" ? "Введённые данные" : "Submitted Data"}</CardTitle>
              <CardDescription>
                {language === "ru" 
                  ? `Всего ${collectedData.length} записей` 
                  : `Total ${collectedData.length} submissions`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collectedData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ru" ? "Нет введённых данных" : "No submitted data"}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ru" ? "Время" : "Time"}</TableHead>
                      <TableHead>{language === "ru" ? "Тип" : "Type"}</TableHead>
                      <TableHead>{language === "ru" ? "Данные" : "Data"}</TableHead>
                      <TableHead>{language === "ru" ? "IP адрес" : "IP Address"}</TableHead>
                      <TableHead>{language === "ru" ? "User Agent" : "User Agent"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectedData.map((data) => (
                      <TableRow key={data.id} data-testid={`row-data-${data.id}`}>
                        <TableCell>
                          {data.submittedAt 
                            ? format(new Date(data.submittedAt), "d MMM yyyy, HH:mm", { locale: dateLocale }) 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{data.dataType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {data.fields && typeof data.fields === 'object' ? (
                              <div className="space-y-1">
                                {Object.entries(data.fields).map(([key, value]) => (
                                  <div key={key} className="flex gap-2 text-sm">
                                    <span className="text-muted-foreground">{key}:</span>
                                    <span className="font-mono truncate">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{data.ipAddress || "-"}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
                            {data.userAgent || "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
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
