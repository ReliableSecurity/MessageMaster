import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileText, MoreVertical, Copy, Edit, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

const templateFormSchema = z.object({
  name: z.string().min(2, "Название должно быть минимум 2 символа"),
  description: z.string().optional(),
  subject: z.string().min(1, "Тема письма обязательна"),
  htmlContent: z.string().min(10, "Содержимое письма обязательно"),
  textContent: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      htmlContent: "",
      textContent: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TemplateFormData) => 
      apiRequest("/api/templates", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Шаблон создан", description: "Новый шаблон успешно добавлен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать шаблон", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TemplateFormData & { id: string }) => 
      apiRequest(`/api/templates/${data.id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setEditingTemplate(null);
      form.reset();
      toast({ title: "Шаблон обновлён", description: "Изменения сохранены" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить шаблон", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Шаблон удалён", description: "Шаблон успешно удалён" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить шаблон", variant: "destructive" });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async (template: Template) => {
      const cloneData = {
        name: `${template.name} (копия)`,
        description: template.description,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      };
      return apiRequest("/api/templates", { method: "POST", body: JSON.stringify(cloneData) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Шаблон скопирован", description: "Копия шаблона создана" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось скопировать шаблон", variant: "destructive" });
    },
  });

  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
                      (activeTab === "ready-made" && template.isGlobal) ||
                      (activeTab === "custom" && !template.isGlobal);
    return matchesSearch && matchesTab;
  }) || [];

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      description: template.description || "",
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
    });
  };

  const onSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      const updateData = { ...data, id: editingTemplate.id };
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(data);
    }
  };

  const canEditTemplate = (template: Template): boolean => {
    if (user?.role === "superadmin") return true;
    return !template.isGlobal;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Шаблоны</h1>
          <p className="text-muted-foreground mt-1">Просмотр и управление email-шаблонами</p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingTemplate} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingTemplate(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Создать шаблон
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Редактировать шаблон" : "Новый шаблон"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input placeholder="Приветственное письмо" {...field} data-testid="input-template-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тема письма</FormLabel>
                        <FormControl>
                          <Input placeholder="Добро пожаловать, {{name}}!" {...field} data-testid="input-template-subject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Input placeholder="Краткое описание шаблона" {...field} data-testid="input-template-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="htmlContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HTML содержимое</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="<html><body>Ваше письмо...</body></html>" 
                          className="min-h-[200px] font-mono text-sm"
                          {...field} 
                          data-testid="textarea-template-html" 
                        />
                      </FormControl>
                      <FormDescription>
                        Используйте переменные: {"{{name}}"}, {"{{email}}"}, {"{{company}}"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="textContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Текстовая версия (опционально)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Текстовая версия письма для клиентов без HTML" 
                          className="min-h-[100px]"
                          {...field} 
                          data-testid="textarea-template-text" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Отмена</Button>
                  </DialogClose>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-template">
                    {editingTemplate ? "Сохранить" : "Создать"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск шаблонов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-templates"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">Все шаблоны</TabsTrigger>
          <TabsTrigger value="ready-made" data-testid="tab-ready-made">Готовые</TabsTrigger>
          <TabsTrigger value="custom" data-testid="tab-custom">Кастомные</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Шаблоны не найдены</p>
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать первый шаблон
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover-elevate" data-testid={`card-template-${template.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-base" data-testid={`text-template-name-${template.id}`}>{template.name}</h3>
                        <Badge variant={template.isGlobal ? "secondary" : "outline"} className="mt-1 text-xs">
                          {template.isGlobal ? "Готовый" : "Кастомный"}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-template-menu-${template.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Предпросмотр
                        </DropdownMenuItem>
                        {canEditTemplate(template) && (
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => cloneMutation.mutate(template)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Дублировать
                        </DropdownMenuItem>
                        {canEditTemplate(template) && !template.isGlobal && (
                          <DropdownMenuItem onClick={() => deleteMutation.mutate(template.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.description || "Без описания"}</p>
                    <p className="text-xs text-muted-foreground mt-3">Использован {template.usageCount} раз</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" data-testid={`button-use-template-${template.id}`}>
                      Использовать
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Предпросмотр: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Тема письма:</p>
              <p className="font-medium">{previewTemplate?.subject}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Содержимое:</p>
              <div 
                className="border rounded-lg p-4 bg-white text-black min-h-[300px]"
                dangerouslySetInnerHTML={{ __html: previewTemplate?.htmlContent || "" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Закрыть</Button>
            <Button onClick={() => {
              if (previewTemplate) {
                handleEdit(previewTemplate);
                setPreviewTemplate(null);
              }
            }}>Редактировать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
