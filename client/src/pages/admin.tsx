import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Building2, 
  BarChart3, 
  Shield, 
  Edit, 
  Key, 
  Trash2,
  Mail,
  Target,
  MousePointer,
  AlertTriangle,
  Eye,
  TrendingUp,
  Loader2,
  Save,
  Download,
  Upload,
  FileText,
  Check,
  FileSpreadsheet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { parseCSV, type ParsedContact } from "@/lib/csv-utils";

interface UserWithCompany {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  companyId: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    monthlyEmailLimit: number;
    dailyEmailLimit: number;
    emailsSentThisMonth: number;
    emailsSentToday: number;
  } | null;
}

interface Company {
  id: string;
  name: string;
  contactEmail: string | null;
  monthlyEmailLimit: number;
  dailyEmailLimit: number;
  emailsSentThisMonth: number;
  emailsSentToday: number;
  isActive: boolean;
  createdAt: string;
}

interface AdminStats {
  totalStats: {
    totalUsers: number;
    totalCompanies: number;
    totalCampaigns: number;
    totalContacts: number;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalSubmitted: number;
  };
  companyStats: Array<{
    company: Company;
    usersCount: number;
    campaignsCount: number;
    contactsCount: number;
    stats: {
      sent: number;
      opened: number;
      clicked: number;
      submitted: number;
    };
  }>;
  userStats: Array<{
    user: UserWithCompany;
    companyName: string;
    campaignsCount: number;
    stats: {
      sent: number;
      opened: number;
      clicked: number;
      submitted: number;
    };
  }>;
}

function EditUserDialog({ 
  user, 
  open, 
  onOpenChange 
}: { 
  user: UserWithCompany; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    role: user.role,
    isActive: user.isActive,
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest("PATCH", `/api/users/${user.id}`, data),
    onSuccess: () => {
      toast({ title: "Пользователь обновлён" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Ошибка обновления", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Редактирование пользователя
          </DialogTitle>
          <DialogDescription>
            Изменение данных пользователя {user.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                data-testid="input-edit-firstname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                data-testid="input-edit-lastname"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="input-edit-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Роль</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger data-testid="select-edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">Суперадмин</SelectItem>
                <SelectItem value="admin">Администратор</SelectItem>
                <SelectItem value="manager">Менеджер</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4"
              data-testid="checkbox-edit-active"
            />
            <Label htmlFor="isActive">Активный аккаунт</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-user">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog({ 
  user, 
  open, 
  onOpenChange 
}: { 
  user: UserWithCompany; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");

  const changeMutation = useMutation({
    mutationFn: (password: string) => 
      apiRequest("POST", `/api/users/${user.id}/change-password`, { newPassword: password }),
    onSuccess: () => {
      toast({ title: "Пароль изменён" });
      setNewPassword("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Ошибка изменения пароля", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Пароль должен быть минимум 6 символов", variant: "destructive" });
      return;
    }
    changeMutation.mutate(newPassword);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Изменение пароля
          </DialogTitle>
          <DialogDescription>
            Установка нового пароля для {user.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Новый пароль</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              minLength={6}
              data-testid="input-new-password"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={changeMutation.isPending} data-testid="button-change-password">
              {changeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Изменить пароль
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCompanyDialog({ 
  company, 
  open, 
  onOpenChange 
}: { 
  company: Company; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: company.name,
    contactEmail: company.contactEmail || "",
    monthlyEmailLimit: company.monthlyEmailLimit,
    dailyEmailLimit: company.dailyEmailLimit,
    isActive: company.isActive,
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest("PATCH", `/api/companies/${company.id}`, data),
    onSuccess: () => {
      toast({ title: "Компания обновлена" });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Ошибка обновления", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Редактирование компании
          </DialogTitle>
          <DialogDescription>
            Изменение данных компании {company.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              data-testid="input-edit-company-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Контактный Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              data-testid="input-edit-company-email"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyEmailLimit">Месячный лимит</Label>
              <Input
                id="monthlyEmailLimit"
                type="number"
                value={formData.monthlyEmailLimit}
                onChange={(e) => setFormData({ ...formData, monthlyEmailLimit: parseInt(e.target.value) || 0 })}
                data-testid="input-edit-monthly-limit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyEmailLimit">Дневной лимит</Label>
              <Input
                id="dailyEmailLimit"
                type="number"
                value={formData.dailyEmailLimit}
                onChange={(e) => setFormData({ ...formData, dailyEmailLimit: parseInt(e.target.value) || 0 })}
                data-testid="input-edit-daily-limit"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="companyIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4"
              data-testid="checkbox-edit-company-active"
            />
            <Label htmlFor="companyIsActive">Активная компания</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-company">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [editingUser, setEditingUser] = useState<UserWithCompany | null>(null);
  const [changingPassword, setChangingPassword] = useState<UserWithCompany | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importCompanyId, setImportCompanyId] = useState<string>("");
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: users, isLoading: usersLoading } = useQuery<UserWithCompany[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: companies, isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const importContactsMutation = useMutation({
    mutationFn: (data: { contacts: ParsedContact[]; companyId: string }) => 
      apiRequest("POST", "/api/admin/imports/contacts", data),
    onSuccess: (result: any) => {
      setIsImportDialogOpen(false);
      setCsvText("");
      setParsedContacts([]);
      setImportCompanyId("");
      toast({ 
        title: "Импорт завершён",
        description: `Импортировано: ${result.imported}, пропущено: ${result.skipped}`
      });
    },
    onError: () => {
      toast({ title: "Ошибка импорта", variant: "destructive" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const parsed = parseCSV(text);
      setParsedContacts(parsed);
    };
    reader.readAsText(file);
  };

  const handleCsvPaste = (text: string) => {
    setCsvText(text);
    const parsed = parseCSV(text);
    setParsedContacts(parsed);
  };

  const handleImport = () => {
    if (parsedContacts.length === 0) {
      toast({ title: "Нет данных для импорта", variant: "destructive" });
      return;
    }
    if (!importCompanyId) {
      toast({ title: "Выберите компанию", variant: "destructive" });
      return;
    }
    importContactsMutation.mutate({ 
      contacts: parsedContacts, 
      companyId: importCompanyId
    });
  };

  const handleExportReports = () => {
    window.open("/api/admin/exports/reports", "_blank");
  };

  const handleExportCredentials = () => {
    window.open("/api/admin/exports/credentials", "_blank");
  };

  const handleExportUsers = () => {
    window.open("/api/admin/exports/users", "_blank");
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Badge variant="destructive">Суперадмин</Badge>;
      case "admin":
        return <Badge>Админ</Badge>;
      default:
        return <Badge variant="secondary">Менеджер</Badge>;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return "∞";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-admin-title">
          <Shield className="h-8 w-8 text-primary" />
          Панель администратора
        </h1>
        <p className="text-muted-foreground mt-1">
          Управление пользователями, компаниями и просмотр статистики
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Пользователи</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                {stats.totalStats.totalUsers}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("admin.organizations")}</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-500" />
                {stats.totalStats.totalCompanies}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("admin.tests")}</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                {stats.totalStats.totalCampaigns}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Контакты</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-500" />
                {stats.totalStats.totalContacts}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Global Funnel Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Глобальная воронка
            </CardTitle>
            <CardDescription>Статистика по всем кампаниям всех компаний</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-lg bg-blue-500/10">
                <Mail className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatNumber(stats.totalStats.totalSent)}</div>
                <div className="text-sm text-muted-foreground">Отправлено</div>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10">
                <Eye className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatNumber(stats.totalStats.totalOpened)}</div>
                <div className="text-sm text-muted-foreground">Открыто</div>
              </div>
              <div className="p-4 rounded-lg bg-orange-500/10">
                <MousePointer className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatNumber(stats.totalStats.totalClicked)}</div>
                <div className="text-sm text-muted-foreground">Кликов</div>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatNumber(stats.totalStats.totalSubmitted)}</div>
                <div className="text-sm text-muted-foreground">Данные введены</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
            <Users className="h-4 w-4" />
            {t("admin.users")}
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-2" data-testid="tab-companies">
            <Building2 className="h-4 w-4" />
            {t("admin.organizations")}
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2" data-testid="tab-stats">
            <BarChart3 className="h-4 w-4" />
            {t("admin.statistics")}
          </TabsTrigger>
          <TabsTrigger value="export-import" className="gap-2" data-testid="tab-export-import">
            <FileSpreadsheet className="h-4 w-4" />
            {t("admin.exportImport")}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Все пользователи</CardTitle>
              <CardDescription>Управление учётными записями пользователей</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Компания</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.company?.name || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">Активен</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">Заблокирован</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingUser(user)}
                              data-testid={`button-edit-user-${user.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setChangingPassword(user)}
                              data-testid={`button-password-user-${user.id}`}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Все компании</CardTitle>
              <CardDescription>Управление компаниями и их лимитами</CardDescription>
            </CardHeader>
            <CardContent>
              {companiesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Контактный Email</TableHead>
                      <TableHead>Месячный лимит</TableHead>
                      <TableHead>Дневной лимит</TableHead>
                      <TableHead>Использовано (мес)</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies?.map((company) => (
                      <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.contactEmail || "—"}</TableCell>
                        <TableCell>{formatNumber(company.monthlyEmailLimit)}</TableCell>
                        <TableCell>{formatNumber(company.dailyEmailLimit)}</TableCell>
                        <TableCell>
                          {formatNumber(company.emailsSentThisMonth)} / {formatNumber(company.monthlyEmailLimit)}
                        </TableCell>
                        <TableCell>
                          {company.isActive ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">Активна</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">Заблокирована</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setEditingCompany(company)}
                            data-testid={`button-edit-company-${company.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Stats Tab */}
        <TabsContent value="stats">
          <div className="space-y-6">
            {/* Company Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Статистика по компаниям</CardTitle>
                <CardDescription>Детальная информация о каждой компании</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.organizations")}</TableHead>
                        <TableHead className="text-center">{t("admin.users")}</TableHead>
                        <TableHead className="text-center">{t("admin.tests")}</TableHead>
                        <TableHead className="text-center">{t("admin.totalContacts")}</TableHead>
                        <TableHead className="text-center">Отправлено</TableHead>
                        <TableHead className="text-center">Открыто</TableHead>
                        <TableHead className="text-center">Клики</TableHead>
                        <TableHead className="text-center">Данные</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.companyStats.map((item) => (
                        <TableRow key={item.company.id}>
                          <TableCell className="font-medium">{item.company.name}</TableCell>
                          <TableCell className="text-center">{item.usersCount}</TableCell>
                          <TableCell className="text-center">{item.campaignsCount}</TableCell>
                          <TableCell className="text-center">{item.contactsCount}</TableCell>
                          <TableCell className="text-center text-blue-600">{item.stats.sent}</TableCell>
                          <TableCell className="text-center text-yellow-600">{item.stats.opened}</TableCell>
                          <TableCell className="text-center text-orange-600">{item.stats.clicked}</TableCell>
                          <TableCell className="text-center text-destructive">{item.stats.submitted}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Статистика по пользователям</CardTitle>
                <CardDescription>Активность каждого пользователя</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.users")}</TableHead>
                        <TableHead>{t("admin.organizations")}</TableHead>
                        <TableHead className="text-center">{t("admin.tests")}</TableHead>
                        <TableHead className="text-center">Отправлено</TableHead>
                        <TableHead className="text-center">Открыто</TableHead>
                        <TableHead className="text-center">Клики</TableHead>
                        <TableHead className="text-center">Данные</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.userStats.map((item) => (
                        <TableRow key={item.user.id}>
                          <TableCell className="font-medium">
                            {item.user.firstName} {item.user.lastName}
                            <div className="text-xs text-muted-foreground">{item.user.email}</div>
                          </TableCell>
                          <TableCell>{item.companyName}</TableCell>
                          <TableCell className="text-center">{item.campaignsCount}</TableCell>
                          <TableCell className="text-center text-blue-600">{item.stats.sent}</TableCell>
                          <TableCell className="text-center text-yellow-600">{item.stats.opened}</TableCell>
                          <TableCell className="text-center text-orange-600">{item.stats.clicked}</TableCell>
                          <TableCell className="text-center text-destructive">{item.stats.submitted}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export/Import Tab */}
        <TabsContent value="export-import">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Экспорт данных
                </CardTitle>
                <CardDescription>Скачать отчёты и данные в формате CSV</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={handleExportReports}
                  data-testid="button-export-reports"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Экспорт отчётов тестирования
                  <span className="text-xs text-muted-foreground ml-auto">
                    Все кампании всех компаний
                  </span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={handleExportCredentials}
                  data-testid="button-export-credentials"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Экспорт собранных данных
                  <span className="text-xs text-muted-foreground ml-auto">
                    Введённые учётные данные
                  </span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={handleExportUsers}
                  data-testid="button-export-users"
                >
                  <Users className="h-4 w-4" />
                  Экспорт списка пользователей
                  <span className="text-xs text-muted-foreground ml-auto">
                    Все пользователи и компании
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Импорт данных
                </CardTitle>
                <CardDescription>Загрузить списки контактов для любой компании</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setIsImportDialogOpen(true)}
                  data-testid="button-open-import-dialog"
                >
                  <Mail className="h-4 w-4" />
                  Импорт контактов
                  <span className="text-xs text-muted-foreground ml-auto">
                    CSV: email, firstName, lastName
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import Contacts Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Импорт контактов
            </DialogTitle>
            <DialogDescription>
              Загрузите CSV файл или вставьте данные. Формат: email, firstName, lastName
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Выберите компанию</Label>
              <Select value={importCompanyId} onValueChange={setImportCompanyId}>
                <SelectTrigger data-testid="select-import-company">
                  <SelectValue placeholder="Выберите компанию" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Загрузить файл CSV</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                ref={fileInputRef}
                onChange={handleFileUpload}
                data-testid="input-admin-import-file"
              />
            </div>
            
            <div className="text-center text-muted-foreground">или</div>
            
            <div className="space-y-2">
              <Label>Вставить данные CSV</Label>
              <Textarea
                placeholder="email,firstName,lastName&#10;test@example.com,Иван,Иванов&#10;user@example.com,Петр,Петров"
                value={csvText}
                onChange={(e) => handleCsvPaste(e.target.value)}
                rows={5}
                data-testid="textarea-admin-import-csv"
              />
            </div>

            {parsedContacts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Найдено контактов: {parsedContacts.length}</span>
                </div>
                <div className="border rounded-lg p-2 max-h-32 overflow-auto text-xs">
                  {parsedContacts.slice(0, 5).map((c, i) => (
                    <div key={i} className="py-1 border-b last:border-0">
                      {c.email} {c.firstName || ''} {c.lastName || ''}
                    </div>
                  ))}
                  {parsedContacts.length > 5 && (
                    <div className="py-1 text-muted-foreground">
                      ... и ещё {parsedContacts.length - 5} контактов
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Отмена</Button>
            </DialogClose>
            <Button 
              onClick={handleImport} 
              disabled={parsedContacts.length === 0 || !importCompanyId || importContactsMutation.isPending}
              data-testid="button-admin-submit-import"
            >
              {importContactsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Импортировать {parsedContacts.length > 0 ? `(${parsedContacts.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog 
          user={editingUser} 
          open={!!editingUser} 
          onOpenChange={(open) => !open && setEditingUser(null)} 
        />
      )}

      {/* Change Password Dialog */}
      {changingPassword && (
        <ChangePasswordDialog 
          user={changingPassword} 
          open={!!changingPassword} 
          onOpenChange={(open) => !open && setChangingPassword(null)} 
        />
      )}

      {/* Edit Company Dialog */}
      {editingCompany && (
        <EditCompanyDialog 
          company={editingCompany} 
          open={!!editingCompany} 
          onOpenChange={(open) => !open && setEditingCompany(null)} 
        />
      )}
    </div>
  );
}
