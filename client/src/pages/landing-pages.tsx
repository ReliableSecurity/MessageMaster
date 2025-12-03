import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Globe, Trash2, Edit, MoreHorizontal, Copy, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { LandingPage } from "@shared/schema";

const landingPageFormSchema = z.object({
  name: z.string().min(2, "Название должно быть минимум 2 символа"),
  description: z.string().optional(),
  htmlContent: z.string().min(10, "HTML контент обязателен"),
  captureCredentials: z.boolean().default(true),
  capturePasswords: z.boolean().default(false),
  redirectUrl: z.string().url("Введите корректный URL").optional().or(z.literal("")),
});

type LandingPageFormData = z.infer<typeof landingPageFormSchema>;

export default function LandingPages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const { toast } = useToast();

  const { data: landingPages, isLoading } = useQuery<LandingPage[]>({
    queryKey: ["/api/landing-pages"],
  });

  const form = useForm<LandingPageFormData>({
    resolver: zodResolver(landingPageFormSchema),
    defaultValues: {
      name: "",
      description: "",
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <title>Login</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .login-form { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 300px; }
    input { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <form class="login-form" method="POST">
    <h2>Вход в систему</h2>
    <input type="text" name="username" placeholder="Имя пользователя" required>
    <input type="password" name="password" placeholder="Пароль" required>
    <button type="submit">Войти</button>
  </form>
</body>
</html>`,
      captureCredentials: true,
      capturePasswords: false,
      redirectUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: LandingPageFormData) => 
      apiRequest("POST", "/api/landing-pages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/landing-pages"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Страница создана" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать страницу", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: LandingPageFormData & { id: string }) => 
      apiRequest("PATCH", `/api/landing-pages/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/landing-pages"] });
      setEditingPage(null);
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Страница обновлена" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить страницу", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/landing-pages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/landing-pages"] });
      toast({ title: "Страница удалена" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить страницу", variant: "destructive" });
    },
  });

  const filteredPages = landingPages?.filter(page => 
    page.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (page: LandingPage) => {
    setEditingPage(page);
    form.reset({
      name: page.name,
      description: page.description || "",
      htmlContent: page.htmlContent,
      captureCredentials: page.captureCredentials,
      capturePasswords: page.capturePasswords,
      redirectUrl: page.redirectUrl || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: LandingPageFormData) => {
    if (editingPage) {
      updateMutation.mutate({ ...data, id: editingPage.id });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Фишинг-страницы</h1>
          <p className="text-muted-foreground mt-1">Страницы для сбора учётных данных</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingPage(null);
            form.reset();
          } else {
            setIsDialogOpen(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPage(null); setIsDialogOpen(true); }} data-testid="button-add-landing-page">
              <Plus className="w-4 h-4 mr-2" />
              Новая страница
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPage ? "Редактировать страницу" : "Новая фишинг-страница"}</DialogTitle>
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
                        <Input placeholder="Office 365 Login" {...field} data-testid="input-landing-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Input placeholder="Имитация страницы входа Office 365" {...field} data-testid="input-landing-description" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="htmlContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HTML контент</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="<!DOCTYPE html>..." 
                          className="font-mono text-sm min-h-[200px]"
                          {...field} 
                          data-testid="textarea-landing-html"
                        />
                      </FormControl>
                      <FormDescription>
                        HTML код страницы. Форма должна использовать method="POST"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="redirectUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL редиректа</FormLabel>
                      <FormControl>
                        <Input placeholder="https://real-site.com" {...field} data-testid="input-landing-redirect-url" />
                      </FormControl>
                      <FormDescription>
                        Куда перенаправить пользователя после отправки формы
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="captureCredentials"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Захват данных</FormLabel>
                          <FormDescription className="text-xs">Сохранять отправленные данные</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-capture-credentials" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capturePasswords"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Сохранять пароли</FormLabel>
                          <FormDescription className="text-xs">Записывать пароли в базу</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-capture-passwords" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" data-testid="button-cancel-landing">Отмена</Button>
                  </DialogClose>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-landing">
                    {editingPage ? "Сохранить" : "Создать"}
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
            placeholder="Поиск страниц..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-landing-pages"
          />
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </CardContent>
        </Card>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Фишинг-страницы не созданы</p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-landing">
              <Plus className="w-4 h-4 mr-2" />
              Создать первую страницу
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Все страницы</CardTitle>
            <CardDescription>{filteredPages.length} страниц</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Настройки захвата</TableHead>
                  <TableHead>Редирект</TableHead>
                  <TableHead>Создана</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => (
                  <TableRow key={page.id} data-testid={`row-landing-page-${page.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{page.name}</p>
                        {page.description && (
                          <p className="text-sm text-muted-foreground">{page.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant={page.captureCredentials ? "default" : "secondary"}>
                          {page.captureCredentials ? "Данные" : "Без данных"}
                        </Badge>
                        {page.capturePasswords && (
                          <Badge variant="destructive">Пароли</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {page.redirectUrl ? (
                        <span className="text-sm truncate max-w-[200px] block">{page.redirectUrl}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(page.createdAt), "d MMM yyyy", { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-landing-menu-${page.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(page)} data-testid={`button-edit-landing-${page.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem data-testid={`button-preview-landing-${page.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Предпросмотр
                          </DropdownMenuItem>
                          <DropdownMenuItem data-testid={`button-copy-landing-${page.id}`}>
                            <Copy className="w-4 h-4 mr-2" />
                            Дублировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(page.id)}
                            className="text-destructive"
                            data-testid={`button-delete-landing-${page.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
