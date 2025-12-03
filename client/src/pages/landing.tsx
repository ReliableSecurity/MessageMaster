import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Target, BarChart3, Users, Shield, Zap, Loader2 } from "lucide-react";
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
            <Mail className="h-5 w-5" />
            MailFlow
          </DialogTitle>
          <DialogDescription>
            Войдите или создайте аккаунт для управления email-кампаниями
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
                  placeholder="email@example.com"
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
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">или</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild data-testid="button-login-replit">
              <a href="/api/login">Войти через Replit</a>
            </Button>
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
                    placeholder="Иванов"
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
                  placeholder="Моя компания"
                  value={registerData.companyName}
                  onChange={(e) => setRegisterData({...registerData, companyName: e.target.value})}
                  required
                  data-testid="input-register-company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input 
                  id="register-email"
                  type="email" 
                  placeholder="email@example.com"
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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold" data-testid="text-logo">MailFlow</span>
          </div>
          <div className="flex gap-2">
            <AuthDialog>
              <Button variant="outline" data-testid="button-login">Войти</Button>
            </AuthDialog>
            <AuthDialog>
              <Button data-testid="button-register">Регистрация</Button>
            </AuthDialog>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-hero-title">
              Управляйте email-кампаниями эффективно
            </h1>
            <p className="text-xl text-muted-foreground mb-8" data-testid="text-hero-description">
              Мощная SaaS-платформа для создания, отправки и отслеживания email-рассылок. 
              Готовые шаблоны, аналитика в реальном времени и интеграция с популярными email-сервисами.
            </p>
            <div className="flex gap-4 justify-center">
              <AuthDialog>
                <Button size="lg" data-testid="button-get-started">
                  Начать бесплатно
                </Button>
              </AuthDialog>
              <Button size="lg" variant="outline" data-testid="button-learn-more">
                Узнать больше
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" data-testid="text-features-title">
              Возможности платформы
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover-elevate" data-testid="card-feature-campaigns">
                <CardHeader>
                  <Target className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Email-кампании</CardTitle>
                  <CardDescription>
                    Создавайте персонализированные кампании с помощью готовых шаблонов или собственного дизайна
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-analytics">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Аналитика</CardTitle>
                  <CardDescription>
                    Отслеживайте открытия, клики и конверсии в реальном времени с детальными отчётами
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-contacts">
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Управление контактами</CardTitle>
                  <CardDescription>
                    Организуйте базу контактов по группам, импортируйте списки и управляйте подписками
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-templates">
                <CardHeader>
                  <Mail className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>10+ готовых шаблонов</CardTitle>
                  <CardDescription>
                    Профессиональные шаблоны для разных целей: маркетинг, уведомления, транзакции
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-integrations">
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Интеграции</CardTitle>
                  <CardDescription>
                    Поддержка SendGrid, Mailgun, AWS SES, Resend и пользовательских SMTP-серверов
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-elevate" data-testid="card-feature-security">
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Безопасность</CardTitle>
                  <CardDescription>
                    Multi-tenant архитектура с изоляцией данных компаний и безопасной аутентификацией
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-6" data-testid="text-cta-title">
              Готовы начать?
            </h2>
            <p className="text-muted-foreground mb-8" data-testid="text-cta-description">
              Присоединяйтесь к компаниям, которые уже используют MailFlow для эффективных email-кампаний
            </p>
            <AuthDialog>
              <Button size="lg" data-testid="button-cta-signup">
                Создать аккаунт
              </Button>
            </AuthDialog>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p data-testid="text-footer-copyright">© 2024 MailFlow. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
