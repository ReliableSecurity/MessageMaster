import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, Upload, Download, MoreHorizontal, Edit, Trash2, Mail, FolderPlus, FileText, Loader2, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Contact, ContactGroup } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseCSV, type ParsedContact } from "@/lib/csv-utils";

const contactFormSchema = z.object({
  email: z.string().email("Введите корректный email"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  position: z.string().optional(),
  groupId: z.string().optional(),
});

const groupFormSchema = z.object({
  name: z.string().min(2, "Название должно быть минимум 2 символа"),
  description: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;
type GroupFormData = z.infer<typeof groupFormSchema>;

export default function UsersGroups() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("groups");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [csvText, setCsvText] = useState("");
  const [importGroupId, setImportGroupId] = useState<string>("");
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: groups, isLoading: groupsLoading } = useQuery<ContactGroup[]>({
    queryKey: ["/api/contact-groups"],
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { email: "", firstName: "", lastName: "", position: "", groupId: "" },
  });

  const groupForm = useForm<GroupFormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: "", description: "" },
  });

  const createContactMutation = useMutation({
    mutationFn: (data: ContactFormData) => apiRequest("POST", "/api/contacts", data),
    onSuccess: () => {
      setIsContactDialogOpen(false);
      setEditingContact(null);
      contactForm.reset();
      toast({ title: "Пользователь добавлен" });
      queryClient.refetchQueries({ queryKey: ["/api/contacts"] });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: GroupFormData) => apiRequest("POST", "/api/contact-groups", data),
    onSuccess: () => {
      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      groupForm.reset();
      toast({ title: "Группа создана" });
      queryClient.refetchQueries({ queryKey: ["/api/contact-groups"] });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: (data: GroupFormData & { id: string }) => 
      apiRequest("PATCH", `/api/contact-groups/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      setEditingGroup(null);
      setIsGroupDialogOpen(false);
      groupForm.reset();
      toast({ title: "Группа обновлена" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Пользователь удален" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contact-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      toast({ title: "Группа удалена" });
    },
  });

  const importContactsMutation = useMutation({
    mutationFn: (data: { contacts: ParsedContact[]; groupId?: string }) => 
      apiRequest("POST", "/api/contacts/import", data),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setIsImportDialogOpen(false);
      setCsvText("");
      setParsedContacts([]);
      setImportGroupId("");
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
    importContactsMutation.mutate({ 
      contacts: parsedContacts, 
      groupId: importGroupId && importGroupId !== "__none__" ? importGroupId : undefined 
    });
  };

  const handleExport = () => {
    window.open("/api/contacts/export", "_blank");
  };

  const handleEditGroup = (group: ContactGroup) => {
    setEditingGroup(group);
    groupForm.reset({
      name: group.name,
      description: group.description || "",
    });
    setIsGroupDialogOpen(true);
  };

  const onGroupSubmit = (data: GroupFormData) => {
    if (editingGroup) {
      updateGroupMutation.mutate({ ...data, id: editingGroup.id });
    } else {
      createGroupMutation.mutate(data);
    }
  };

  const filteredContacts = contacts?.filter(contact => 
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredGroups = groups?.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getContactsInGroup = (groupId: string) => {
    return contacts?.filter(c => c.groupId === groupId).length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Пользователи и группы</h1>
          <p className="text-muted-foreground mt-1">Управление целевыми пользователями для фишинг-кампаний</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import">
                <Upload className="w-4 h-4 mr-2" />
                Импорт CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Импорт пользователей из CSV
                </DialogTitle>
                <DialogDescription>
                  Загрузите CSV файл или вставьте данные. Формат: email, firstName, lastName, position
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Загрузить файл CSV</Label>
                  <Input
                    type="file"
                    accept=".csv,.txt"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    data-testid="input-import-file"
                  />
                </div>
                
                <div className="text-center text-muted-foreground">или</div>
                
                <div className="space-y-2">
                  <Label>Вставить данные CSV</Label>
                  <Textarea
                    placeholder="email,firstName,lastName,position&#10;test@example.com,Иван,Иванов,Менеджер"
                    value={csvText}
                    onChange={(e) => handleCsvPaste(e.target.value)}
                    rows={5}
                    data-testid="textarea-import-csv"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Группа</Label>
                  <Select value={importGroupId} onValueChange={setImportGroupId}>
                    <SelectTrigger data-testid="select-import-group">
                      <SelectValue placeholder="Выберите группу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Без группы</SelectItem>
                      {groups?.map(group => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {parsedContacts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Найдено пользователей: {parsedContacts.length}</span>
                    </div>
                    <div className="border rounded-lg p-2 max-h-32 overflow-auto text-xs">
                      {parsedContacts.slice(0, 5).map((c, i) => (
                        <div key={i} className="py-1 border-b last:border-0">
                          {c.email} - {c.firstName || ''} {c.lastName || ''}
                        </div>
                      ))}
                      {parsedContacts.length > 5 && (
                        <div className="py-1 text-muted-foreground">
                          ... и ещё {parsedContacts.length - 5}
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
                  disabled={parsedContacts.length === 0 || importContactsMutation.isPending}
                  data-testid="button-submit-import"
                >
                  {importContactsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Импортировать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{contacts?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Всего пользователей</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FolderPlus className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{groups?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Групп</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="groups" data-testid="tab-groups">Группы</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Пользователи</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Группы пользователей</CardTitle>
                <CardDescription>{filteredGroups.length} групп</CardDescription>
              </div>
              <Dialog open={isGroupDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setIsGroupDialogOpen(false);
                  setEditingGroup(null);
                  groupForm.reset();
                } else {
                  setIsGroupDialogOpen(true);
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setEditingGroup(null); groupForm.reset({ name: "", description: "" }); setIsGroupDialogOpen(true); }} data-testid="button-add-group">
                    <Plus className="w-4 h-4 mr-2" />
                    Новая группа
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingGroup ? "Редактировать группу" : "Новая группа"}</DialogTitle>
                    <DialogDescription>
                      {editingGroup ? "Измените название или описание группы" : "Создайте новую группу для организации контактов"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...groupForm}>
                    <form onSubmit={groupForm.handleSubmit(onGroupSubmit)} className="space-y-4">
                      <FormField
                        control={groupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Название</FormLabel>
                            <FormControl>
                              <Input placeholder="IT отдел" {...field} data-testid="input-group-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={groupForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Описание</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Сотрудники IT отдела" {...field} data-testid="textarea-group-description" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={createGroupMutation.isPending || updateGroupMutation.isPending} data-testid="button-submit-group">
                          {editingGroup ? "Сохранить" : "Создать"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {groupsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Группы не созданы</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Группа</TableHead>
                      <TableHead>Пользователей</TableHead>
                      <TableHead>Создана</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id} data-testid={`row-group-${group.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{group.name}</p>
                            {group.description && (
                              <p className="text-sm text-muted-foreground">{group.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getContactsInGroup(group.id)}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(group.createdAt), "d MMM yyyy", { locale: ru })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-group-menu-${group.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditGroup(group)} data-testid={`button-edit-group-${group.id}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteGroupMutation.mutate(group.id)}
                                className="text-destructive"
                                data-testid={`button-delete-group-${group.id}`}
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
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Все пользователи</CardTitle>
                <CardDescription>{filteredContacts.length} пользователей</CardDescription>
              </div>
              <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-user">
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить пользователя
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новый пользователь</DialogTitle>
                    <DialogDescription>
                      Добавьте нового пользователя для фишинг-тестирования
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...contactForm}>
                    <form onSubmit={contactForm.handleSubmit((data) => createContactMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={contactForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} data-testid="input-user-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={contactForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Имя</FormLabel>
                              <FormControl>
                                <Input placeholder="Иван" {...field} data-testid="input-user-firstname" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contactForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Фамилия</FormLabel>
                              <FormControl>
                                <Input placeholder="Иванов" {...field} data-testid="input-user-lastname" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={contactForm.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Должность</FormLabel>
                            <FormControl>
                              <Input placeholder="Менеджер" {...field} data-testid="input-user-position" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={contactForm.control}
                        name="groupId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Группа</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-user-group">
                                  <SelectValue placeholder="Выберите группу" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {groups?.map(group => (
                                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline" data-testid="button-cancel-user">Отмена</Button>
                        </DialogClose>
                        <Button type="submit" disabled={createContactMutation.isPending} data-testid="button-submit-user">
                          Добавить
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Пользователи не найдены</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Группа</TableHead>
                      <TableHead>Добавлен</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => {
                      const group = groups?.find(g => g.id === contact.groupId);
                      return (
                        <TableRow key={contact.id} data-testid={`row-user-${contact.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {(contact.firstName?.[0] || contact.email[0]).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {contact.firstName || contact.lastName 
                                    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                    : contact.email}
                                </p>
                                <p className="text-sm text-muted-foreground">{contact.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {group ? (
                              <Badge variant="outline">{group.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(contact.createdAt), "d MMM yyyy", { locale: ru })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-user-menu-${contact.id}`}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem data-testid={`button-email-user-${contact.id}`}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Написать
                                </DropdownMenuItem>
                                <DropdownMenuItem data-testid={`button-edit-user-${contact.id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Редактировать
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteContactMutation.mutate(contact.id)}
                                  className="text-destructive"
                                  data-testid={`button-delete-user-${contact.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Удалить
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
