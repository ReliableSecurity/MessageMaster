import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Mail, Settings, CheckCircle2, XCircle, Trash2, Edit, Send, Eye, EyeOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailService } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

const emailServiceFormSchema = z.object({
  name: z.string().min(2, "Название должно быть минимум 2 символа"),
  provider: z.enum(["sendgrid", "mailgun", "aws-ses", "resend", "smtp"]),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  fromEmail: z.string().email("Введите корректный email").optional().or(z.literal("")),
  fromName: z.string().optional(),
  isActive: z.boolean().default(true),
});

const createServiceFormSchema = emailServiceFormSchema.extend({
  apiKey: z.string().min(1, "API ключ обязателен"),
});

type EmailServiceFormData = z.infer<typeof emailServiceFormSchema>;

const providerLogos: Record<string, string> = {
  sendgrid: "SG",
  mailgun: "MG",
  "aws-ses": "AWS",
  resend: "RS",
  smtp: "SMTP",
};

const providerNames: Record<string, string> = {
  sendgrid: "SendGrid",
  mailgun: "Mailgun",
  "aws-ses": "AWS SES",
  resend: "Resend",
  smtp: "SMTP",
};

export default function Services() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<EmailService | null>(null);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: services, isLoading } = useQuery<EmailService[]>({
    queryKey: ["/api/email-services"],
  });

  const form = useForm<EmailServiceFormData>({
    resolver: zodResolver(editingService ? emailServiceFormSchema : createServiceFormSchema),
    defaultValues: {
      name: "",
      provider: "sendgrid",
      apiKey: "",
      apiSecret: "",
      fromEmail: "",
      fromName: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: EmailServiceFormData) => 
      apiRequest("/api/email-services", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-services"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Сервис добавлен", description: "Email сервис успешно настроен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось добавить сервис", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EmailServiceFormData & { id: string }) => {
      const updateData: any = { ...data };
      if (!updateData.apiKey) delete updateData.apiKey;
      if (!updateData.apiSecret) delete updateData.apiSecret;
      return apiRequest(`/api/email-services/${data.id}`, { method: "PATCH", body: JSON.stringify(updateData) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-services"] });
      setEditingService(null);
      form.reset();
      toast({ title: "Сервис обновлён", description: "Настройки email сервиса изменены" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить сервис", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/email-services/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-services"] });
      toast({ title: "Сервис удалён", description: "Email сервис успешно удалён" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить сервис", variant: "destructive" });
    },
  });

  const filteredServices = services?.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.provider.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (service: EmailService) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      provider: service.provider,
      apiKey: "",
      apiSecret: "",
      fromEmail: service.fromEmail || "",
      fromName: service.fromName || "",
      isActive: service.isActive,
    });
  };

  const onSubmit = (data: EmailServiceFormData) => {
    if (editingService) {
      updateMutation.mutate({ ...data, id: editingService.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const maskApiKey = (apiKey: string): string => {
    if (apiKey.length <= 8) return "********";
    return apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
  };

  const formatLastUsed = (date: string | null): string => {
    if (!date) return "Никогда";
    const lastUsed = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - lastUsed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    return `${diffDays} дн. назад`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Email сервисы</h1>
          <p className="text-muted-foreground mt-1">Управление провайдерами отправки email</p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingService} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingService(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-service">
              <Plus className="w-4 h-4 mr-2" />
              Добавить сервис
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingService ? "Редактировать сервис" : "Новый email сервис"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                        <Input placeholder="SendGrid Production" {...field} data-testid="input-service-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Провайдер</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-provider">
                            <SelectValue placeholder="Выберите провайдера" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                          <SelectItem value="aws-ses">AWS SES</SelectItem>
                          <SelectItem value="resend">Resend</SelectItem>
                          <SelectItem value="smtp">SMTP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Ключ {editingService && <span className="text-muted-foreground font-normal">(опционально)</span>}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={editingService ? "Оставьте пустым, чтобы сохранить текущий" : "Ваш API ключ"} {...field} data-testid="input-api-key" />
                      </FormControl>
                      <FormDescription>
                        {editingService 
                          ? "Оставьте пустым, чтобы сохранить текущий ключ"
                          : form.watch("provider") === "smtp" ? "Пароль SMTP сервера" : "API ключ от провайдера"
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(form.watch("provider") === "aws-ses" || form.watch("provider") === "smtp") && (
                  <FormField
                    control={form.control}
                    name="apiSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{form.watch("provider") === "smtp" ? "Хост SMTP" : "Secret Key"}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={form.watch("provider") === "smtp" ? "smtp.example.com:587" : "Secret Access Key"} 
                            {...field} 
                            data-testid="input-api-secret" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email отправителя</FormLabel>
                        <FormControl>
                          <Input placeholder="noreply@company.com" {...field} data-testid="input-from-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя отправителя</FormLabel>
                        <FormControl>
                          <Input placeholder="Компания" {...field} data-testid="input-from-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Активен</FormLabel>
                        <FormDescription>Использовать для отправки писем</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Отмена</Button>
                  </DialogClose>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-service">
                    {editingService ? "Сохранить" : "Добавить"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск сервисов..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-services"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Email сервисы не настроены</p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить первый сервис
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} data-testid={`card-service-${service.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-mono font-semibold text-sm">
                    {providerLogos[service.provider]}
                  </div>
                  <div>
                    <h3 className="font-medium text-base" data-testid={`text-service-name-${service.id}`}>{service.name}</h3>
                    <p className="text-xs text-muted-foreground">{providerNames[service.provider]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {service.isPlatformDefault && (
                    <Badge variant="outline" className="text-xs">Платформа</Badge>
                  )}
                  <Badge
                    variant={service.isActive ? "default" : "secondary"}
                    className="gap-1"
                    data-testid={`badge-status-${service.id}`}
                  >
                    {service.isActive ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {service.isActive ? "Активен" : "Неактивен"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">API Ключ</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1">
                      {showApiKey === service.id ? service.apiKey : maskApiKey(service.apiKey)}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setShowApiKey(showApiKey === service.id ? null : service.id)}
                    >
                      {showApiKey === service.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
                {service.fromEmail && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Отправитель</p>
                    <p className="text-sm">{service.fromName ? `${service.fromName} <${service.fromEmail}>` : service.fromEmail}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Последнее использование: {formatLastUsed(service.lastUsedAt)}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => handleEdit(service)}
                  disabled={service.isPlatformDefault && user?.role !== "superadmin"}
                  data-testid={`button-configure-${service.id}`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Настроить
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" data-testid={`button-actions-${service.id}`}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Send className="w-4 h-4 mr-2" />
                      Тест отправки
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteMutation.mutate(service.id)}
                      className="text-destructive"
                      disabled={service.isPlatformDefault}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
