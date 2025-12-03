import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Target, BarChart3, Users, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold" data-testid="text-logo">MailFlow</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Войти</a>
          </Button>
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
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">Начать бесплатно</a>
              </Button>
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
            <Button size="lg" asChild data-testid="button-cta-signup">
              <a href="/api/login">Создать аккаунт</a>
            </Button>
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
