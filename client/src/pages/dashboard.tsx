import { useQuery } from "@tanstack/react-query";
import { Mail, Users, Eye, MousePointerClick, FileKey } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewCampaignDialog } from "@/components/new-campaign-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Campaign, Company } from "@shared/schema";

interface DashboardStats {
  totalCampaigns: number;
  totalContacts: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalSubmitted: number;
  submitRate: number;
}

const statusConfig = {
  draft: { label: "Черновик", variant: "secondary" as const },
  scheduled: { label: "Запланирована", variant: "outline" as const },
  sending: { label: "Отправляется", variant: "default" as const },
  sent: { label: "Отправлена", variant: "default" as const },
  paused: { label: "Приостановлена", variant: "secondary" as const },
  cancelled: { label: "Отменена", variant: "destructive" as const },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies", user?.companyId],
    enabled: !!user?.companyId,
  });

  const recentCampaigns = campaigns?.slice(0, 5) || [];

  const totals = {
    sent: stats?.totalSent ?? campaigns?.reduce((acc, c) => acc + c.sentCount, 0) ?? 0,
    opened: stats?.totalOpened ?? campaigns?.reduce((acc, c) => acc + c.openedCount, 0) ?? 0,
    clicked: stats?.totalClicked ?? campaigns?.reduce((acc, c) => acc + c.clickedCount, 0) ?? 0,
    submitted: stats?.totalSubmitted ?? campaigns?.reduce((acc, c) => acc + (c.submittedDataCount || 0), 0) ?? 0,
  };

  const isLoading = campaignsLoading || statsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Главная</h1>
          <p className="text-muted-foreground mt-1">
            {company ? `${company.name} - Обзор email-кампаний` : "Обзор email-кампаний"}
          </p>
        </div>
        <NewCampaignDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.campaigns")}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-campaigns">
                {stats?.totalCampaigns ?? campaigns?.length ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {campaigns?.filter(c => c.status === "sent").length || 0} отправлено
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Отправлено</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-sent">
                {totals.sent.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              писем за всё время
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Открыто</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="stat-opened">
                  {totals.opened.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totals.sent > 0 ? Math.round((totals.opened / totals.sent) * 100) : 0}% от отправленных
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Переходы</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="stat-clicked">
                  {totals.clicked.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totals.opened > 0 ? Math.round((totals.clicked / totals.opened) * 100) : 0}% от открытых
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Данные собраны</CardTitle>
            <FileKey className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="stat-submitted">
                  {totals.submitted.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totals.clicked > 0 ? Math.round((totals.submitted / totals.clicked) * 100) : 0}% от переходов
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {company && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Лимит рассылок сегодня</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Использовано</span>
                <span className="font-medium">{company.emailsSentToday.toLocaleString()} / {company.dailyEmailLimit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((company.emailsSentToday / company.dailyEmailLimit) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Лимит рассылок в месяц</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Использовано</span>
                <span className="font-medium">{company.emailsSentThisMonth.toLocaleString()} / {company.monthlyEmailLimit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((company.emailsSentThisMonth / company.monthlyEmailLimit) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Недавние кампании</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Нет кампаний</p>
              <p className="text-sm">Создайте первую кампанию для начала работы</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Кампания</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Отправлено</TableHead>
                  <TableHead>Открыто</TableHead>
                  <TableHead>Клики</TableHead>
                  <TableHead>Данные</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCampaigns.map((campaign) => {
                  const status = statusConfig[campaign.status];
                  const openRate = campaign.sentCount > 0 
                    ? Math.round((campaign.openedCount / campaign.sentCount) * 100) 
                    : 0;
                  const clickRate = campaign.openedCount > 0 
                    ? Math.round((campaign.clickedCount / campaign.openedCount) * 100) 
                    : 0;
                  const submitRate = campaign.clickedCount > 0
                    ? Math.round(((campaign.submittedDataCount || 0) / campaign.clickedCount) * 100)
                    : 0;

                  return (
                    <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">{campaign.subject}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>{campaign.sentCount.toLocaleString()}</TableCell>
                      <TableCell>
                        {campaign.openedCount.toLocaleString()}
                        {campaign.sentCount > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">({openRate}%)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.clickedCount.toLocaleString()}
                        {campaign.openedCount > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">({clickRate}%)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(campaign.submittedDataCount || 0).toLocaleString()}
                        {campaign.clickedCount > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">({submitRate}%)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.sentAt 
                          ? format(new Date(campaign.sentAt), "d MMM yyyy", { locale: ru })
                          : format(new Date(campaign.createdAt), "d MMM yyyy", { locale: ru })
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
