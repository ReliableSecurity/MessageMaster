import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  Target, 
  BarChart3, 
  Users, 
  Mail, 
  Crosshair,
  AlertTriangle,
  Lock,
  Eye,
  MousePointer,
  FileText,
  CheckCircle,
  TrendingUp,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

function AuthDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    companyName: "",
  });
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const registerMutation = useMutation({
    mutationFn: (data: typeof registerData) => 
      apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
      }),
    onSuccess: () => {
      toast({ title: "Регистрация успешна", description: "Добро пожаловать!" });
      setOpen(false);
      window.location.reload();
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка регистрации", 
        description: error.message || "Попробуйте ещё раз",
        variant: "destructive" 
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: typeof loginData) => 
      apiRequest("POST", "/api/auth/login", data),
    onSuccess: () => {
      window.location.reload();
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка входа", 
        description: error.message || "Неверный email или пароль",
        variant: "destructive" 
      });
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast({ title: "Ошибка", description: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    registerMutation.mutate(registerData);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            PhishGuard
          </DialogTitle>
          <DialogDescription>
            Войдите или создайте аккаунт для тестирования безопасности
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">Вход</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register">Регистрация</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input 
                  id="login-email"
                  type="email" 
                  placeholder="security@company.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  required
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input 
                  id="login-password"
                  type="password" 
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                  data-testid="input-login-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-submit-login">
                {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Войти
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input 
                    id="firstName"
                    placeholder="Иван"
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                    required
                    data-testid="input-register-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input 
                    id="lastName"
                    placeholder="Петров"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                    required
                    data-testid="input-register-lastname"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Название компании</Label>
                <Input 
                  id="companyName"
                  placeholder="ООО Безопасность"
                  value={registerData.companyName}
                  onChange={(e) => setRegisterData({...registerData, companyName: e.target.value})}
                  required
                  data-testid="input-register-company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Корпоративный Email</Label>
                <Input 
                  id="register-email"
                  type="email" 
                  placeholder="security@company.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  required
                  data-testid="input-register-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Пароль</Label>
                <Input 
                  id="register-password"
                  type="password" 
                  placeholder="Минимум 6 символов"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  required
                  minLength={6}
                  data-testid="input-register-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input 
                  id="confirmPassword"
                  type="password" 
                  placeholder="Повторите пароль"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  required
                  data-testid="input-register-confirm-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={registerMutation.isPending} data-testid="button-submit-register">
                {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Зарегистрироваться
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold" data-testid="text-logo">PhishGuard</span>
            <span className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">Security Platform</span>
          </div>
          <div className="flex gap-2">
            <AuthDialog>
              <Button variant="outline" data-testid="button-login">Войти</Button>
            </AuthDialog>
            <AuthDialog>
              <Button data-testid="button-register">Начать тестирование</Button>
            </AuthDialog>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full mb-6">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">91% успешных кибератак начинаются с фишинга</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" data-testid="text-hero-title">
              Проверьте устойчивость вашего персонала к <span className="text-primary">фишинговым атакам</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
              Платформа для проведения контролируемых фишинговых симуляций. 
              Тестируйте сотрудников, выявляйте уязвимости и повышайте уровень кибербезопасности организации.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <AuthDialog>
                <Button size="lg" className="gap-2" data-testid="button-get-started">
                  <Crosshair className="h-5 w-5" />
                  Запустить симуляцию
                </Button>
              </AuthDialog>
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-learn-more">
                <Eye className="h-5 w-5" />
                Демо платформы
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 px-4 border-y bg-muted/30">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Компаний защищено</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">1M+</div>
                <div className="text-sm text-muted-foreground">Писем отправлено</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">85%</div>
                <div className="text-sm text-muted-foreground">Снижение кликов</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Шаблонов атак</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4" data-testid="text-how-it-works-title">
              Как работает симуляция фишинга
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Полный цикл тестирования: от создания кампании до анализа результатов
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute top-6 left-1/2 w-full h-0.5 bg-border hidden md:block" />
                  <h3 className="font-semibold mb-2">1. Создание кампании</h3>
                  <p className="text-sm text-muted-foreground">
                    Выберите шаблон фишингового письма или создайте свой
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Выбор целей</h3>
                  <p className="text-sm text-muted-foreground">
                    Загрузите список сотрудников или выберите группы
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Запуск атаки</h3>
                  <p className="text-sm text-muted-foreground">
                    Отправьте симулированные фишинговые письма
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">4. Анализ результатов</h3>
                  <p className="text-sm text-muted-foreground">
                    Получите детальную статистику и отчёты
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4" data-testid="text-features-title">
              Возможности платформы
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Профессиональный инструментарий для оценки устойчивости персонала к социальной инженерии
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover-elevate" data-testid="card-feature-templates">
                <CardHeader>
                  <Target className="h-10 w-10 text-destructive mb-2" />
                  <CardTitle>Библиотека шаблонов атак</CardTitle>
                  <CardDescription>
                    50+ готовых сценариев: поддельные банки, IT-поддержка, HR-рассылки, срочные уведомления и корпоративные письма
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-tracking">
                <CardHeader>
                  <MousePointer className="h-10 w-10 text-orange-500 mb-2" />
                  <CardTitle>Полное отслеживание</CardTitle>
                  <CardDescription>
                    Фиксация каждого действия: открытие письма, переход по ссылке, ввод учётных данных на фишинговой странице
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-landing">
                <CardHeader>
                  <Lock className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Фишинговые страницы</CardTitle>
                  <CardDescription>
                    Создавайте реалистичные страницы для сбора учётных данных с автоматическим редиректом на обучающий контент
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-analytics">
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-green-500 mb-2" />
                  <CardTitle>Детальная аналитика</CardTitle>
                  <CardDescription>
                    Воронка конверсии: отправлено → открыто → кликнуто → введены данные. Сравнение кампаний и отделов
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-groups">
                <CardHeader>
                  <Users className="h-10 w-10 text-blue-500 mb-2" />
                  <CardTitle>Сегментация персонала</CardTitle>
                  <CardDescription>
                    Группировка сотрудников по отделам, должностям, уровню доступа для таргетированного тестирования
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-reports">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-purple-500 mb-2" />
                  <CardTitle>Отчёты для руководства</CardTitle>
                  <CardDescription>
                    Готовые отчёты для CISO и руководства: риски, уязвимые сотрудники, рекомендации по обучению
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Tracking Funnel */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-4">
              Воронка отслеживания
            </h2>
            <p className="text-muted-foreground text-center mb-12">
              Отслеживаем каждый этап взаимодействия сотрудника с фишинговым письмом
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Отправлено</div>
                  <div className="text-sm text-muted-foreground">Письмо доставлено в почтовый ящик сотрудника</div>
                </div>
                <div className="text-2xl font-bold text-blue-500">100%</div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Открыто</div>
                  <div className="text-sm text-muted-foreground">Сотрудник открыл письмо (отслеживающий пиксель)</div>
                </div>
                <div className="text-2xl font-bold text-yellow-500">~65%</div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <MousePointer className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Переход по ссылке</div>
                  <div className="text-sm text-muted-foreground">Сотрудник кликнул на фишинговую ссылку</div>
                </div>
                <div className="text-2xl font-bold text-orange-500">~25%</div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card border-destructive/50">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-destructive">Введены учётные данные</div>
                  <div className="text-sm text-muted-foreground">Сотрудник ввёл логин/пароль на фейковой странице</div>
                </div>
                <div className="text-2xl font-bold text-destructive">~12%</div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">
              Сценарии использования
            </h2>
            <p className="text-muted-foreground text-center mb-12">
              PhishGuard применяется для различных задач информационной безопасности
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Пентест персонала
                  </CardTitle>
                  <CardDescription>
                    Проведение контролируемых фишинговых атак для оценки уровня осведомлённости сотрудников о киберугрозах
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Выявление уязвимых групп сотрудников
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Оценка эффективности текущего обучения
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Подготовка к аудитам безопасности
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-destructive" />
                    Red Team операции
                  </CardTitle>
                  <CardDescription>
                    Симуляция реальных APT-атак с использованием фишинга как начального вектора проникновения
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Таргетированный спирфишинг
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Сбор учётных данных
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Тестирование SOC/Blue Team
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Security Awareness
                  </CardTitle>
                  <CardDescription>
                    Программа непрерывного обучения персонала с регулярными проверками и адаптивным контентом
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Автоматическое обучение после провала
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Геймификация и рейтинги
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Отслеживание прогресса
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Compliance & Аудит
                  </CardTitle>
                  <CardDescription>
                    Документирование мероприятий по тестированию для соответствия требованиям регуляторов
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Отчёты для ISO 27001
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Соответствие GDPR
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      История всех тестирований
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-primary/5">
          <div className="container mx-auto text-center max-w-2xl">
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4" data-testid="text-cta-title">
              Начните защищать свою организацию
            </h2>
            <p className="text-muted-foreground mb-8" data-testid="text-cta-description">
              Узнайте, насколько ваши сотрудники готовы к фишинговым атакам. 
              Первая кампания — бесплатно.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <AuthDialog>
                <Button size="lg" className="gap-2" data-testid="button-cta-signup">
                  <Crosshair className="h-5 w-5" />
                  Создать аккаунт
                </Button>
              </AuthDialog>
              <Button size="lg" variant="outline" className="gap-2">
                <Mail className="h-5 w-5" />
                Связаться с нами
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">PhishGuard</span>
              <span className="text-sm text-muted-foreground">— платформа для тестирования безопасности</span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-footer-copyright">
              © 2024 PhishGuard. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
