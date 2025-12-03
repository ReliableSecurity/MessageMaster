import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2, Users, Mail, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import type { Company } from "@shared/schema";

const companyFormSchema = z.object({
  name: z.string().min(2, "Название должно быть минимум 2 символа"),
  domain: z.string().optional(),
  contactEmail: z.string().email("Введите корректный email").optional().or(z.literal("")),
  monthlyEmailLimit: z.coerce.number().min(100, "Минимум 100 писем"),
  dailyEmailLimit: z.coerce.number().min(10, "Минимум 10 писем"),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      domain: "",
      contactEmail: "",
      monthlyEmailLimit: 10000,
      dailyEmailLimit: 1000,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CompanyFormData) => apiRequest("/api/companies", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Компания создана", description: "Новая компания успешно добавлена" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать компанию", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CompanyFormData & { id: string }) => 
      apiRequest(`/api/companies/${data.id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setEditingCompany(null);
      form.reset();
      toast({ title: "Компания обновлена", description: "Данные компании успешно изменены" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить компанию", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/companies/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Компания удалена", description: "Компания успешно удалена" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить компанию", variant: "destructive" });
    },
  });

  const filteredCompanies = companies?.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    form.reset({
      name: company.name,
      domain: company.domain || "",
      contactEmail: company.contactEmail || "",
      monthlyEmailLimit: company.monthlyEmailLimit,
      dailyEmailLimit: company.dailyEmailLimit,
    });
  };

  const onSubmit = (data: CompanyFormData) => {
    if (editingCompany) {
      updateMutation.mutate({ ...data, id: editingCompany.id });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">{t("admin.organizations")}</h1>
          <p className="text-muted-foreground mt-1">{t("nav.companies")}</p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingCompany} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingCompany(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-company">
              <Plus className="w-4 h-4 mr-2" />
              Добавить компанию
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Редактировать компанию" : "Новая компания"}</DialogTitle>
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
                        <Input placeholder="ООО Компания" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Домен</FormLabel>
                      <FormControl>
                        <Input placeholder="company.com" {...field} data-testid="input-company-domain" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Контактный email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@company.com" {...field} data-testid="input-company-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyEmailLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Лимит/месяц</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-monthly-limit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dailyEmailLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Лимит/день</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-daily-limit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Отмена</Button>
                  </DialogClose>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-company">
                    {editingCompany ? "Сохранить" : "Создать"}
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
            placeholder="Поиск компаний..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-companies"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Все компании
          </CardTitle>
          <CardDescription>
            {isLoading ? "Загрузка..." : `${filteredCompanies.length} компаний`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("admin.noOrganizations")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Домен</TableHead>
                  <TableHead>Лимиты</TableHead>
                  <TableHead>Использовано</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">{company.contactEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{company.domain || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{company.dailyEmailLimit.toLocaleString()}/день</p>
                        <p className="text-muted-foreground">{company.monthlyEmailLimit.toLocaleString()}/мес</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{company.emailsSentToday.toLocaleString()} сегодня</p>
                        <p className="text-muted-foreground">{company.emailsSentThisMonth.toLocaleString()} за месяц</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.isActive ? "default" : "secondary"}>
                        {company.isActive ? "Активна" : "Неактивна"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-actions-${company.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(company)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(company.id)}
                            className="text-destructive"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
