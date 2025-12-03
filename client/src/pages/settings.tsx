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
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, Mail, Key, Building2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, Language } from "@/lib/i18n";

export default function Settings() {
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("profile");
  
  const [profileData, setProfileData] = useState({
    firstName: "Иван",
    lastName: "Иванов",
    email: "ivan@example.com",
  });

  const [notifications, setNotifications] = useState({
    emailCampaigns: true,
    newResponses: true,
    weeklyReports: true,
    securityAlerts: true,
  });

  const [appearance, setAppearance] = useState({
    theme: "system",
    compactMode: false,
  });

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
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Профиль</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Уведомления</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Безопасность</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Внешний вид</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Компания</span>
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
              <CardTitle>Внешний вид</CardTitle>
              <CardDescription>Настройте внешний вид приложения</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Тема</Label>
                <Select 
                  value={appearance.theme} 
                  onValueChange={(value) => setAppearance({ ...appearance, theme: value })}
                >
                  <SelectTrigger className="w-[200px]" data-testid="select-theme">
                    <SelectValue placeholder="Выберите тему" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Светлая</SelectItem>
                    <SelectItem value="dark">Темная</SelectItem>
                    <SelectItem value="system">Системная</SelectItem>
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
                  <Label>Компактный режим</Label>
                  <p className="text-sm text-muted-foreground">Уменьшить отступы для отображения большего контента</p>
                </div>
                <Switch 
                  checked={appearance.compactMode}
                  onCheckedChange={(checked) => setAppearance({ ...appearance, compactMode: checked })}
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
