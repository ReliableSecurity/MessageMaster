import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, Upload, Trash2, Mail, Eye, MousePointer, KeyRound, Clock, CheckCircle2, UserPlus, FileUp, UsersIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { parseCSV } from "@/lib/csv-utils";
import type { Campaign, Contact, ContactGroup, CampaignRecipient } from "@shared/schema";

const statusConfig = {
  pending: { label: "Ожидает", color: "bg-gray-500", icon: Clock },
  sent: { label: "Отправлено", color: "bg-blue-500", icon: Mail },
  opened: { label: "Открыто", color: "bg-green-500", icon: Eye },
  clicked: { label: "Клик", color: "bg-yellow-500", icon: MousePointer },
  submitted_data: { label: "Данные введены", color: "bg-red-500", icon: KeyRound },
};

type RecipientWithContact = CampaignRecipient & {
  contact?: Contact;
};

export default function Recipients() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [csvText, setCsvText] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: recipients, isLoading: recipientsLoading } = useQuery<RecipientWithContact[]>({
    queryKey: ["/api/campaign-recipients", selectedCampaignId],
    enabled: !!selectedCampaignId,
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: groups } = useQuery<ContactGroup[]>({
    queryKey: ["/api/contact-groups"],
  });

  const addRecipientsMutation = useMutation({
    mutationFn: (data: { campaignId: string; contactIds: string[] }) => 
      apiRequest("POST", `/api/campaign-recipients`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-recipients", variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Получатели добавлены" });
      setAddDialogOpen(false);
      setSelectedContactIds([]);
      setSelectedGroupId("");
    },
    onError: () => {
      toast({ title: "Ошибка при добавлении получателей", variant: "destructive" });
    },
  });

  const importRecipientsMutation = useMutation({
    mutationFn: (data: { campaignId: string; contacts: { email: string; firstName?: string; lastName?: string }[] }) => 
      apiRequest("POST", `/api/campaign-recipients/import`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-recipients", variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Получатели импортированы" });
      setImportDialogOpen(false);
      setCsvText("");
      setCsvFile(null);
    },
    onError: () => {
      toast({ title: "Ошибка при импорте получателей", variant: "destructive" });
    },
  });

  const removeRecipientMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/campaign-recipients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-recipients", selectedCampaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Получатель удален" });
    },
  });

  const selectedCampaign = campaigns?.find(c => c.id === selectedCampaignId);

  const filteredRecipients = recipients?.filter(r => {
    const contact = r.contact;
    const matchesSearch = !searchQuery || 
      contact?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusStats = () => {
    if (!recipients) return { pending: 0, sent: 0, opened: 0, clicked: 0, submitted_data: 0 };
    return {
      pending: recipients.filter(r => r.status === "pending").length,
      sent: recipients.filter(r => r.status === "sent").length,
      opened: recipients.filter(r => r.status === "opened").length,
      clicked: recipients.filter(r => r.status === "clicked").length,
      submitted_data: recipients.filter(r => r.status === "submitted_data").length,
    };
  };

  const stats = getStatusStats();
  const totalRecipients = recipients?.length || 0;

  const handleAddFromGroup = () => {
    if (!selectedGroupId || !selectedCampaignId) return;
    const groupContacts = contacts?.filter(c => c.groupId === selectedGroupId) || [];
    const contactIds = groupContacts.map(c => c.id);
    if (contactIds.length > 0) {
      addRecipientsMutation.mutate({ campaignId: selectedCampaignId, contactIds });
    }
  };

  const handleAddSelected = () => {
    if (selectedContactIds.length === 0 || !selectedCampaignId) return;
    addRecipientsMutation.mutate({ campaignId: selectedCampaignId, contactIds: selectedContactIds });
  };

  const handleImportCSV = async () => {
    if (!selectedCampaignId) return;
    
    let text = csvText;
    if (csvFile) {
      text = await csvFile.text();
    }
    
    if (!text.trim()) {
      toast({ title: "CSV пустой", variant: "destructive" });
      return;
    }

    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      toast({ title: "Не найдено валидных записей", variant: "destructive" });
      return;
    }

    importRecipientsMutation.mutate({ campaignId: selectedCampaignId, contacts: parsed });
  };

  const existingRecipientEmails = new Set(recipients?.map(r => r.contact?.email?.toLowerCase()) || []);
  const availableContacts = contacts?.filter(c => !existingRecipientEmails.has(c.email.toLowerCase())) || [];

  if (campaignsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Получатели рассылки</h1>
          <p className="text-muted-foreground mt-1">Управление списком получателей кампаний</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Выберите кампанию</CardTitle>
          <CardDescription>Выберите кампанию для управления её получателями</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-full md:w-96" data-testid="select-campaign">
              <SelectValue placeholder="Выберите кампанию..." />
            </SelectTrigger>
            <SelectContent>
              {campaigns?.map(campaign => (
                <SelectItem key={campaign.id} value={campaign.id} data-testid={`campaign-option-${campaign.id}`}>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{campaign.name}</span>
                    <Badge variant="outline" className="ml-2">{campaign.totalRecipients} получ.</Badge>
                  </div>
                </SelectItem>
              ))}
              {campaigns?.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  Нет созданных кампаний
                </div>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCampaignId && selectedCampaign && (
        <>
          <div className="grid grid-cols-5 gap-4">
            {(Object.entries(statusConfig) as [keyof typeof statusConfig, typeof statusConfig[keyof typeof statusConfig]][]).map(([key, config]) => (
              <Card key={key}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.color}/20 flex items-center justify-center`}>
                      <config.icon className={`w-5 h-5 ${config.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <p className="text-xl font-semibold">{stats[key]}</p>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalRecipients > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Воронка кампании</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-32">Отправлено</span>
                    <Progress value={(stats.sent / totalRecipients) * 100} className="flex-1" />
                    <span className="text-sm w-16 text-right">{Math.round((stats.sent / totalRecipients) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-32">Открыто</span>
                    <Progress value={(stats.opened / totalRecipients) * 100} className="flex-1" />
                    <span className="text-sm w-16 text-right">{Math.round((stats.opened / totalRecipients) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-32">Кликнули</span>
                    <Progress value={(stats.clicked / totalRecipients) * 100} className="flex-1" />
                    <span className="text-sm w-16 text-right">{Math.round((stats.clicked / totalRecipients) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-32">Ввели данные</span>
                    <Progress value={(stats.submitted_data / totalRecipients) * 100} className="flex-1" />
                    <span className="text-sm w-16 text-right">{Math.round((stats.submitted_data / totalRecipients) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Получатели: {selectedCampaign.name}</CardTitle>
                  <CardDescription>Всего: {totalRecipients} получателей</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-recipients">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Добавить контакты
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Добавить получателей</DialogTitle>
                        <DialogDescription>Выберите контакты или группу для добавления в кампанию</DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="contacts" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="contacts">Контакты</TabsTrigger>
                          <TabsTrigger value="groups">Группы</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="contacts" className="space-y-4">
                          <div className="max-h-64 overflow-y-auto border rounded-lg">
                            {availableContacts.length === 0 ? (
                              <div className="p-4 text-center text-muted-foreground">
                                Нет доступных контактов для добавления
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Имя</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {availableContacts.map(contact => (
                                    <TableRow key={contact.id}>
                                      <TableCell>
                                        <Checkbox
                                          checked={selectedContactIds.includes(contact.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedContactIds([...selectedContactIds, contact.id]);
                                            } else {
                                              setSelectedContactIds(selectedContactIds.filter(id => id !== contact.id));
                                            }
                                          }}
                                          data-testid={`checkbox-contact-${contact.id}`}
                                        />
                                      </TableCell>
                                      <TableCell>{contact.email}</TableCell>
                                      <TableCell>
                                        {contact.firstName} {contact.lastName}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Выбрано: {selectedContactIds.length}
                            </span>
                            <Button 
                              onClick={handleAddSelected} 
                              disabled={selectedContactIds.length === 0 || addRecipientsMutation.isPending}
                              data-testid="button-add-selected-contacts"
                            >
                              Добавить выбранных
                            </Button>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="groups" className="space-y-4">
                          <div className="space-y-2">
                            <Label>Выберите группу контактов</Label>
                            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                              <SelectTrigger data-testid="select-group">
                                <SelectValue placeholder="Выберите группу..." />
                              </SelectTrigger>
                              <SelectContent>
                                {groups?.map(group => (
                                  <SelectItem key={group.id} value={group.id}>
                                    <div className="flex items-center gap-2">
                                      <UsersIcon className="w-4 h-4" />
                                      <span>{group.name}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {contacts?.filter(c => c.groupId === group.id).length || 0} конт.
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={handleAddFromGroup} 
                            disabled={!selectedGroupId || addRecipientsMutation.isPending}
                            className="w-full"
                            data-testid="button-add-from-group"
                          >
                            Добавить всех из группы
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-import-recipients">
                        <FileUp className="w-4 h-4 mr-2" />
                        Импорт CSV
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Импорт получателей из CSV</DialogTitle>
                        <DialogDescription>
                          Загрузите файл CSV или вставьте данные. Формат: email, имя, фамилия
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Загрузить файл</Label>
                          <Input
                            type="file"
                            accept=".csv,.txt"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            data-testid="input-csv-file"
                          />
                        </div>
                        
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">или</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Вставить данные</Label>
                          <Textarea
                            value={csvText}
                            onChange={(e) => setCsvText(e.target.value)}
                            placeholder="email;имя;фамилия
ivanov@example.com;Иван;Иванов
petrov@example.com;Пётр;Петров"
                            rows={6}
                            data-testid="textarea-csv"
                          />
                        </div>

                        <div className="bg-muted p-3 rounded-lg text-sm">
                          <p className="font-medium mb-1">Поддерживаемые форматы:</p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Разделители: запятая (,) или точка с запятой (;)</li>
                            <li>Колонки: email/почта, имя/first_name, фамилия/last_name</li>
                            <li>Новые контакты будут созданы автоматически</li>
                          </ul>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                          Отмена
                        </Button>
                        <Button 
                          onClick={handleImportCSV} 
                          disabled={(!csvText.trim() && !csvFile) || importRecipientsMutation.isPending}
                          data-testid="button-import-submit"
                        >
                          {importRecipientsMutation.isPending ? "Импорт..." : "Импортировать"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по email или имени..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-recipients"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    {(Object.entries(statusConfig) as [keyof typeof statusConfig, typeof statusConfig[keyof typeof statusConfig]][]).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {recipientsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Нет получателей</p>
                  <p className="text-sm">Добавьте контакты из списка или импортируйте CSV</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Отправлено</TableHead>
                      <TableHead>Открыто</TableHead>
                      <TableHead>Клик</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecipients.map(recipient => {
                      const config = statusConfig[recipient.status];
                      return (
                        <TableRow key={recipient.id} data-testid={`row-recipient-${recipient.id}`}>
                          <TableCell className="font-medium">{recipient.contact?.email || "-"}</TableCell>
                          <TableCell>
                            {recipient.contact?.firstName} {recipient.contact?.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <div className={`w-2 h-2 rounded-full ${config.color}`} />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {recipient.sentAt ? format(new Date(recipient.sentAt), "dd MMM HH:mm", { locale: ru }) : "-"}
                          </TableCell>
                          <TableCell>
                            {recipient.openedAt ? format(new Date(recipient.openedAt), "dd MMM HH:mm", { locale: ru }) : "-"}
                          </TableCell>
                          <TableCell>
                            {recipient.clickedAt ? format(new Date(recipient.clickedAt), "dd MMM HH:mm", { locale: ru }) : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRecipientMutation.mutate(recipient.id)}
                              disabled={recipient.status !== "pending"}
                              data-testid={`button-remove-recipient-${recipient.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
