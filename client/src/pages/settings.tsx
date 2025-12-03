import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, Mail, Key, Building2, CreditCard, Users, Plus, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, Language } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType, Campaign } from "@shared/schema";

interface ViewerWithAccess extends Omit<UserType, 'password'> {
  campaignIds: string[];
}

export default function Settings() {
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  
  const [profileData, setProfileData] = useState({
    firstName: "Иван",
    lastName: "Иванов",
    email: "ivan@example.com",
  });

  // Viewer management state
  const [isViewerDialogOpen, setIsViewerDialogOpen] = useState(false);
  const [editingViewer, setEditingViewer] = useState<ViewerWithAccess | null>(null);
  const [viewerForm, setViewerForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    campaignIds: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);

  // Fetch viewers
  const { data: viewers = [], isLoading: viewersLoading } = useQuery<ViewerWithAccess[]>({
    queryKey: ["/api/viewers"],
  });

  // Fetch campaigns for selection
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Create viewer mutation
  const createViewerMutation = useMutation({
    mutationFn: (data: typeof viewerForm) => apiRequest("POST", "/api/viewers", data),
    onSuccess: () => {
      setIsViewerDialogOpen(false);
      resetViewerForm();
      queryClient.invalidateQueries({ queryKey: ["/api/viewers"] });
      toast({ title: language === "ru" ? "Просмотрщик создан" : "Viewer created" });
    },
    onError: (error: any) => {
      toast({ 
        title: language === "ru" ? "Ошибка" : "Error", 
        description: error.message || (language === "ru" ? "Не удалось создать просмотрщика" : "Failed to create viewer"),
        variant: "destructive" 
      });
    },
  });

  // Update viewer access mutation
  const updateViewerAccessMutation = useMutation({
    mutationFn: ({ id, campaignIds }: { id: string; campaignIds: string[] }) => 
      apiRequest("PATCH", `/api/viewers/${id}/access`, { campaignIds }),
    onSuccess: () => {
      setIsViewerDialogOpen(false);
      setEditingViewer(null);
      resetViewerForm();
      queryClient.invalidateQueries({ queryKey: ["/api/viewers"] });
      toast({ title: language === "ru" ? "Доступ обновлён" : "Access updated" });
    },
    onError: (error: any) => {
      toast({ 
        title: language === "ru" ? "Ошибка" : "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete viewer mutation
  const deleteViewerMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/viewers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/viewers"] });
      toast({ title: language === "ru" ? "Просмотрщик удалён" : "Viewer deleted" });
    },
    onError: (error: any) => {
      toast({ 
        title: language === "ru" ? "Ошибка" : "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const resetViewerForm = () => {
    setViewerForm({ email: "", password: "", firstName: "", lastName: "", campaignIds: [] });
    setShowPassword(false);
  };

  const handleOpenCreateViewer = () => {
    setEditingViewer(null);
    resetViewerForm();
    setIsViewerDialogOpen(true);
  };

  const handleOpenEditViewer = (viewer: ViewerWithAccess) => {
    setEditingViewer(viewer);
    setViewerForm({
      email: viewer.email || "",
      password: "",
      firstName: viewer.firstName || "",
      lastName: viewer.lastName || "",
      campaignIds: viewer.campaignIds || [],
    });
    setIsViewerDialogOpen(true);
  };

  const handleSaveViewer = () => {
    if (editingViewer) {
      updateViewerAccessMutation.mutate({ id: editingViewer.id, campaignIds: viewerForm.campaignIds });
    } else {
      if (!viewerForm.email || !viewerForm.password || !viewerForm.firstName || !viewerForm.lastName) {
        toast({ 
          title: language === "ru" ? "Заполните все поля" : "Fill all fields", 
          variant: "destructive" 
        });
        return;
      }
      createViewerMutation.mutate(viewerForm);
    }
  };

  const handleDeleteViewer = (id: string) => {
    if (confirm(language === "ru" ? "Вы уверены, что хотите удалить этого просмотрщика?" : "Are you sure you want to delete this viewer?")) {
      deleteViewerMutation.mutate(id);
    }
  };

  const toggleCampaignAccess = (campaignId: string) => {
    setViewerForm(prev => ({
      ...prev,
      campaignIds: prev.campaignIds.includes(campaignId)
        ? prev.campaignIds.filter(id => id !== campaignId)
        : [...prev.campaignIds, campaignId]
    }));
  };

  const [notifications, setNotifications] = useState({
    emailCampaigns: true,
    newResponses: true,
    weeklyReports: true,
    securityAlerts: true,
  });

  const [compactMode, setCompactMode] = useState(false);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as Language);
    toast({ 
      title: lang === "ru" ? "Язык изменён" : "Language changed", 
      description: lang === "ru" ? "Интерфейс переключен на русский" : "Interface switched to English" 
    });
  };

  const handleSaveProfile = () => {
    toast({ title: t("settings.profileSaved"), description: t("settings.profileSavedDesc") });
  };

  const handleSaveNotifications = () => {
    toast({ title: t("settings.notificationsSaved") });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-[720px]">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{language === "ru" ? "Профиль" : "Profile"}</span>
          </TabsTrigger>
          <TabsTrigger value="viewers" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{language === "ru" ? "Просмотр" : "Viewers"}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">{language === "ru" ? "Уведомления" : "Notifications"}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">{language === "ru" ? "Безопасность" : "Security"}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">{language === "ru" ? "Вид" : "Theme"}</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">{language === "ru" ? "Компания" : "Company"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Личная информация</CardTitle>
              <CardDescription>Обновите свои личные данные</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl">ИИ</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">Изменить фото</Button>
                  <p className="text-sm text-muted-foreground mt-2">JPG, PNG или GIF. Максимум 2MB</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input 
                    id="firstName" 
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input 
                    id="lastName" 
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} data-testid="button-save-profile">
                Сохранить изменения
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="viewers" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{language === "ru" ? "Просмотрщики кампаний" : "Campaign Viewers"}</CardTitle>
                <CardDescription>
                  {language === "ru" 
                    ? "Создайте аккаунты с ограниченным доступом для просмотра определённых кампаний" 
                    : "Create limited accounts to view specific campaigns"}
                </CardDescription>
              </div>
              <Button onClick={handleOpenCreateViewer} data-testid="button-create-viewer">
                <Plus className="w-4 h-4 mr-2" />
                {language === "ru" ? "Добавить" : "Add"}
              </Button>
            </CardHeader>
            <CardContent>
              {viewersLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === "ru" ? "Загрузка..." : "Loading..."}
                </div>
              ) : viewers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ru" ? "Нет просмотрщиков" : "No viewers"}</p>
                  <p className="text-sm mt-2">
                    {language === "ru" 
                      ? "Создайте аккаунт для предоставления доступа к кампаниям" 
                      : "Create an account to grant access to campaigns"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ru" ? "Пользователь" : "User"}</TableHead>
                      <TableHead>{language === "ru" ? "Email" : "Email"}</TableHead>
                      <TableHead>{language === "ru" ? "Доступ к кампаниям" : "Campaign Access"}</TableHead>
                      <TableHead>{language === "ru" ? "Статус" : "Status"}</TableHead>
                      <TableHead className="text-right">{language === "ru" ? "Действия" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewers.map((viewer) => (
                      <TableRow key={viewer.id} data-testid={`row-viewer-${viewer.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-sm">
                                {(viewer.firstName?.[0] || "").toUpperCase()}{(viewer.lastName?.[0] || "").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{viewer.firstName} {viewer.lastName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{viewer.email}</TableCell>
                        <TableCell>
                          {viewer.campaignIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {viewer.campaignIds.slice(0, 3).map(campaignId => {
                                const campaign = campaigns.find(c => c.id === campaignId);
                                return (
                                  <Badge key={campaignId} variant="secondary" className="text-xs">
                                    {campaign?.name || campaignId.slice(0, 8)}
                                  </Badge>
                                );
                              })}
                              {viewer.campaignIds.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{viewer.campaignIds.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {language === "ru" ? "Нет доступа" : "No access"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={viewer.isActive ? "default" : "secondary"}>
                            {viewer.isActive 
                              ? (language === "ru" ? "Активен" : "Active") 
                              : (language === "ru" ? "Неактивен" : "Inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleOpenEditViewer(viewer)}
                              data-testid={`button-edit-viewer-${viewer.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-destructive"
                              onClick={() => handleDeleteViewer(viewer.id)}
                              data-testid={`button-delete-viewer-${viewer.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
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

          <Dialog open={isViewerDialogOpen} onOpenChange={setIsViewerDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingViewer 
                    ? (language === "ru" ? "Редактировать доступ" : "Edit Access") 
                    : (language === "ru" ? "Создать просмотрщика" : "Create Viewer")}
                </DialogTitle>
                <DialogDescription>
                  {editingViewer
                    ? (language === "ru" ? "Измените доступ к кампаниям" : "Change campaign access")
                    : (language === "ru" ? "Создайте аккаунт с ограниченным доступом" : "Create a limited access account")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!editingViewer && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{language === "ru" ? "Имя" : "First Name"}</Label>
                        <Input
                          value={viewerForm.firstName}
                          onChange={(e) => setViewerForm({ ...viewerForm, firstName: e.target.value })}
                          placeholder={language === "ru" ? "Иван" : "John"}
                          data-testid="input-viewer-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === "ru" ? "Фамилия" : "Last Name"}</Label>
                        <Input
                          value={viewerForm.lastName}
                          onChange={(e) => setViewerForm({ ...viewerForm, lastName: e.target.value })}
                          placeholder={language === "ru" ? "Иванов" : "Doe"}
                          data-testid="input-viewer-last-name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={viewerForm.email}
                        onChange={(e) => setViewerForm({ ...viewerForm, email: e.target.value })}
                        placeholder="viewer@example.com"
                        data-testid="input-viewer-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "ru" ? "Пароль" : "Password"}</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={viewerForm.password}
                          onChange={(e) => setViewerForm({ ...viewerForm, password: e.target.value })}
                          placeholder={language === "ru" ? "Минимум 6 символов" : "Minimum 6 characters"}
                          data-testid="input-viewer-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>{language === "ru" ? "Доступ к кампаниям" : "Campaign Access"}</Label>
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {campaigns.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        {language === "ru" ? "Нет доступных кампаний" : "No campaigns available"}
                      </div>
                    ) : (
                      <div className="p-2 space-y-2">
                        {campaigns.map((campaign) => (
                          <div key={campaign.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`campaign-${campaign.id}`}
                              checked={viewerForm.campaignIds.includes(campaign.id)}
                              onCheckedChange={() => toggleCampaignAccess(campaign.id)}
                              data-testid={`checkbox-campaign-${campaign.id}`}
                            />
                            <label
                              htmlFor={`campaign-${campaign.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {campaign.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewerDialogOpen(false)}>
                  {language === "ru" ? "Отмена" : "Cancel"}
                </Button>
                <Button 
                  onClick={handleSaveViewer}
                  disabled={createViewerMutation.isPending || updateViewerAccessMutation.isPending}
                  data-testid="button-save-viewer"
                >
                  {createViewerMutation.isPending || updateViewerAccessMutation.isPending
                    ? (language === "ru" ? "Сохранение..." : "Saving...")
                    : (language === "ru" ? "Сохранить" : "Save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email уведомления</CardTitle>
              <CardDescription>Настройте, какие уведомления вы хотите получать</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Статус кампаний</Label>
                  <p className="text-sm text-muted-foreground">Уведомления о завершении и ошибках отправки</p>
                </div>
                <Switch 
                  checked={notifications.emailCampaigns}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailCampaigns: checked })}
                  data-testid="switch-campaign-notifications"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Новые отклики</Label>
                  <p className="text-sm text-muted-foreground">Уведомления о полученных данных и ответах</p>
                </div>
                <Switch 
                  checked={notifications.newResponses}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, newResponses: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Еженедельные отчеты</Label>
                  <p className="text-sm text-muted-foreground">Сводка статистики каждую неделю</p>
                </div>
                <Switch 
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Уведомления безопасности</Label>
                  <p className="text-sm text-muted-foreground">Оповещения о подозрительной активности</p>
                </div>
                <Switch 
                  checked={notifications.securityAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, securityAlerts: checked })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications}>Сохранить настройки</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Изменить пароль</CardTitle>
              <CardDescription>Регулярно обновляйте пароль для безопасности</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Текущий пароль</Label>
                <Input id="currentPassword" type="password" data-testid="input-current-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Новый пароль</Label>
                <Input id="newPassword" type="password" data-testid="input-new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input id="confirmPassword" type="password" data-testid="input-confirm-password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button data-testid="button-change-password">Изменить пароль</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Двухфакторная аутентификация</CardTitle>
              <CardDescription>Добавьте дополнительный уровень защиты</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">Используйте приложение для генерации кодов</p>
                  </div>
                </div>
                <Badge variant="secondary">Не настроено</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Настроить 2FA</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активные сессии</CardTitle>
              <CardDescription>Управление активными входами</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Chrome на Windows</p>
                    <p className="text-sm text-muted-foreground">Москва, Россия - Текущая сессия</p>
                  </div>
                </div>
                <Badge>Активна</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="text-destructive">Завершить все сессии</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ru" ? "Внешний вид" : "Appearance"}</CardTitle>
              <CardDescription>{language === "ru" ? "Настройте внешний вид приложения" : "Customize the app appearance"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{language === "ru" ? "Тема" : "Theme"}</Label>
                <Select 
                  value={theme} 
                  onValueChange={(value) => {
                    setTheme(value as "light" | "dark" | "system");
                    toast({ 
                      title: language === "ru" ? "Тема изменена" : "Theme changed",
                      description: language === "ru" 
                        ? (value === "light" ? "Светлая тема" : value === "dark" ? "Тёмная тема" : "Системная тема")
                        : (value === "light" ? "Light theme" : value === "dark" ? "Dark theme" : "System theme")
                    });
                  }}
                >
                  <SelectTrigger className="w-[200px]" data-testid="select-theme">
                    <SelectValue placeholder={language === "ru" ? "Выберите тему" : "Select theme"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{language === "ru" ? "Светлая" : "Light"}</SelectItem>
                    <SelectItem value="dark">{language === "ru" ? "Тёмная" : "Dark"}</SelectItem>
                    <SelectItem value="system">{language === "ru" ? "Системная" : "System"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t("settings.language")}</Label>
                <Select 
                  value={language} 
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className="w-[200px]" data-testid="select-language">
                    <SelectValue placeholder={language === "ru" ? "Выберите язык" : "Select language"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "ru" ? "Компактный режим" : "Compact mode"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "ru" ? "Уменьшить отступы для отображения большего контента" : "Reduce padding to show more content"}
                  </p>
                </div>
                <Switch 
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о компании</CardTitle>
              <CardDescription>Основные данные вашей компании</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Название компании</Label>
                <Input id="companyName" defaultValue="ООО Компания" data-testid="input-company-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyDomain">Домен</Label>
                  <Input id="companyDomain" defaultValue="company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Контактный email</Label>
                  <Input id="companyEmail" type="email" defaultValue="info@company.com" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Сохранить</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Лимиты рассылок</CardTitle>
              <CardDescription>Текущие лимиты вашей компании</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Дневной лимит</p>
                  <p className="text-2xl font-semibold">1,000 / 1,000</p>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "0%" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Месячный лимит</p>
                  <p className="text-2xl font-semibold">0 / 10,000</p>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">
                <CreditCard className="w-4 h-4 mr-2" />
                Увеличить лимит
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
