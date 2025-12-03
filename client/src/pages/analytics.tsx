import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, Mail, MousePointer, Eye, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";

const mockChartData = [
  { date: "Пн", sent: 1200, opened: 840, clicked: 320 },
  { date: "Вт", sent: 1500, opened: 1050, clicked: 450 },
  { date: "Ср", sent: 1800, opened: 1260, clicked: 540 },
  { date: "Чт", sent: 1400, opened: 980, clicked: 420 },
  { date: "Пт", sent: 2100, opened: 1470, clicked: 630 },
  { date: "Сб", sent: 800, opened: 560, clicked: 240 },
  { date: "Вс", sent: 600, opened: 420, clicked: 180 },
];

const mockCampaignPerformance = [
  { name: "Новогодняя распродажа", openRate: 72, clickRate: 28 },
  { name: "Весенняя коллекция", openRate: 68, clickRate: 24 },
  { name: "Приветственное письмо", openRate: 85, clickRate: 42 },
  { name: "Еженедельная рассылка", openRate: 58, clickRate: 18 },
  { name: "Спецпредложение", openRate: 64, clickRate: 32 },
];

const mockDeviceData = [
  { name: "Desktop", value: 45, color: "hsl(var(--primary))" },
  { name: "Mobile", value: 40, color: "hsl(var(--chart-2))" },
  { name: "Tablet", value: 15, color: "hsl(var(--chart-3))" },
];

export default function Analytics() {
  const [period, setPeriod] = useState("7d");

  const stats = {
    totalSent: 12450,
    totalOpened: 8715,
    totalClicked: 3735,
    openRate: 70,
    clickRate: 30,
    unsubscribeRate: 0.3,
    bounceRate: 1.2,
    sentChange: 12.5,
    openChange: 8.3,
    clickChange: -2.1,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Аналитика</h1>
          <p className="text-muted-foreground mt-1">Статистика и отчеты по email-кампаниям</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]" data-testid="select-period">
            <SelectValue placeholder="Период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Последние 7 дней</SelectItem>
            <SelectItem value="30d">Последние 30 дней</SelectItem>
            <SelectItem value="90d">Последние 90 дней</SelectItem>
            <SelectItem value="year">За год</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Отправлено</p>
                <p className="text-2xl font-semibold mt-1">{stats.totalSent.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.sentChange > 0 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">+{stats.sentChange}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{stats.sentChange}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Открыто</p>
                <p className="text-2xl font-semibold mt-1">{stats.totalOpened.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm text-muted-foreground">{stats.openRate}% open rate</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Переходов</p>
                <p className="text-2xl font-semibold mt-1">{stats.totalClicked.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm text-muted-foreground">{stats.clickRate}% click rate</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Отписки</p>
                <p className="text-2xl font-semibold mt-1">{stats.unsubscribeRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm text-muted-foreground">Bounce: {stats.bounceRate}%</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Динамика рассылок</CardTitle>
            <CardDescription>Отправлено, открыто и переходы по дням</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSent)" name="Отправлено" />
                  <Area type="monotone" dataKey="opened" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorOpened)" name="Открыто" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Устройства</CardTitle>
            <CardDescription>Распределение по устройствам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockDeviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockDeviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {mockDeviceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Эффективность кампаний</CardTitle>
          <CardDescription>Open Rate и Click Rate по кампаниям</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCampaignPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="name" className="text-xs" width={150} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="openRate" fill="hsl(var(--primary))" name="Open Rate %" radius={[0, 4, 4, 0]} />
                <Bar dataKey="clickRate" fill="hsl(var(--chart-2))" name="Click Rate %" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
