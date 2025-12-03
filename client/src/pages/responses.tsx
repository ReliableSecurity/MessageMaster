import { useState } from "react";
import { ResponsesTable } from "@/components/responses-table";
import { CollectedDataTable } from "@/components/collected-data-table";
import { ResponseDetailSheet } from "@/components/response-detail-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Mail, MousePointerClick, FormInput, AlertCircle } from "lucide-react";

const mockResponses = [
  {
    id: "1",
    recipientEmail: "ivan@example.com",
    recipientName: "Иван Петров",
    subject: "Re: Весенняя распродажа 2024",
    responseDate: "15 ноя, 2025 14:32",
    campaignName: "Весенняя распродажа 2024",
    type: "reply" as const,
    content: "Здравствуйте,\n\nСпасибо за предложение! Мне очень интересны товары весенней распродажи.",
  },
  {
    id: "2",
    recipientEmail: "anna@company.com",
    recipientName: "Анна Смирнова",
    subject: "Вопрос о продукте",
    responseDate: "15 ноя, 2025 13:15",
    campaignName: "Новинки каталога",
    type: "reply" as const,
    content: "Можете прислать больше деталей о новой линейке продуктов?",
  },
  {
    id: "3",
    recipientEmail: "mike@mail.com",
    recipientName: "Михаил Козлов",
    subject: "Клик: Посмотреть товары",
    responseDate: "15 ноя, 2025 12:45",
    campaignName: "Весенняя распродажа 2024",
    type: "click" as const,
    clickedUrl: "https://example.com/products/spring-collection",
  },
  {
    id: "4",
    recipientEmail: "elena@email.com",
    recipientName: "Елена Волкова",
    subject: "Отправка формы",
    responseDate: "15 ноя, 2025 11:20",
    campaignName: "Опрос клиентов",
    type: "form-submit" as const,
    formData: {
      satisfaction: "Очень доволен",
      recommendation: "9/10",
    },
  },
];

const mockCollectedData = [
  {
    id: "1",
    recipientEmail: "target@example.com",
    recipientName: "Алексей Иванов",
    campaignName: "Тест портала входа",
    dataType: "credentials" as const,
    fields: {
      "username": "alex.ivanov",
      "password": "********",
      "ip_address": "192.168.1.45",
    } as Record<string, string>,
    collectedDate: "15 ноя, 2025 15:23",
    status: "verified" as const,
  },
  {
    id: "2",
    recipientEmail: "user2@company.com",
    recipientName: "Мария Гарсия",
    campaignName: "Опрос Q4",
    dataType: "survey-response" as const,
    fields: {
      "satisfaction": "Очень доволен",
      "recommendation": "9/10",
      "comments": "Отличный сервис!",
    } as Record<string, string>,
    collectedDate: "15 ноя, 2025 14:15",
    status: "verified" as const,
  },
  {
    id: "3",
    recipientEmail: "demo@test.com",
    recipientName: "Роберт Чен",
    campaignName: "Форма регистрации",
    dataType: "form-data" as const,
    fields: {
      "full_name": "Роберт Чен",
      "phone": "+7-555-0123",
      "company": "Tech Corp",
      "role": "Менеджер",
    } as Record<string, string>,
    collectedDate: "15 ноя, 2025 13:42",
    status: "pending" as const,
  },
  {
    id: "4",
    recipientEmail: "suspicious@domain.com",
    recipientName: "Неизвестный",
    campaignName: "Тест безопасности",
    dataType: "credentials" as const,
    fields: {
      "username": "admin",
      "password": "********",
    } as Record<string, string>,
    collectedDate: "15 ноя, 2025 12:30",
    status: "flagged" as const,
  },
];

export default function Responses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<typeof mockResponses[0] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleViewResponse = (id: string) => {
    const response = mockResponses.find(r => r.id === id);
    if (response) {
      setSelectedResponse(response);
      setSheetOpen(true);
    }
  };

  const filteredResponses = mockResponses.filter((response) =>
    response.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    response.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    response.campaignName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredData = mockCollectedData.filter((entry) =>
    entry.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.campaignName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Отклики и данные</h1>
        <p className="text-muted-foreground mt-1">Отслеживание ответов и собранной информации</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Всего откликов"
          value="147"
          icon={Mail}
          trend={{ value: 23.5, isPositive: true }}
          testId="stat-responses"
        />
        <StatCard
          title="Переходы по ссылкам"
          value="89"
          icon={MousePointerClick}
          trend={{ value: 15.2, isPositive: true }}
          testId="stat-clicks"
        />
        <StatCard
          title="Отправки форм"
          value="34"
          icon={FormInput}
          trend={{ value: 8.3, isPositive: true }}
          testId="stat-forms"
        />
        <StatCard
          title="Помечено"
          value="5"
          icon={AlertCircle}
          trend={{ value: 2.1, isPositive: false }}
          testId="stat-flagged"
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по получателю, кампании..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
          data-testid="input-search-responses"
        />
      </div>

      <Tabs defaultValue="responses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="responses" data-testid="tab-responses">
            Ответы на email
          </TabsTrigger>
          <TabsTrigger value="collected-data" data-testid="tab-collected-data">
            Собранные данные
          </TabsTrigger>
        </TabsList>

        <TabsContent value="responses">
          <ResponsesTable responses={filteredResponses} onView={handleViewResponse} />
        </TabsContent>

        <TabsContent value="collected-data">
          <CollectedDataTable data={filteredData} />
        </TabsContent>
      </Tabs>

      <ResponseDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        response={selectedResponse || undefined}
      />
    </div>
  );
}
