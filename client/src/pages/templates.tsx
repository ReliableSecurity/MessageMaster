import { useState } from "react";
import { TemplateCard } from "@/components/template-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";

const mockTemplates = [
  { id: "1", name: "Приветственное письмо", type: "ready-made" as const, description: "Профессиональный шаблон приветствия для новых подписчиков с персонализацией.", usageCount: 145 },
  { id: "2", name: "Запуск продукта", type: "custom" as const, description: "Кастомный шаблон для анонса новых продуктов с привлекательным дизайном.", usageCount: 23 },
  { id: "3", name: "Ежемесячная рассылка", type: "ready-made" as const, description: "Чистый и современный шаблон для ежемесячных обновлений и новостей компании.", usageCount: 89 },
  { id: "4", name: "Промо-акция", type: "ready-made" as const, description: "Яркий шаблон для промо-кампаний и специальных предложений.", usageCount: 234 },
  { id: "5", name: "Приглашение на мероприятие", type: "custom" as const, description: "Кастомный шаблон приглашения на вебинары и мероприятия.", usageCount: 56 },
  { id: "6", name: "Запрос обратной связи", type: "ready-made" as const, description: "Профессиональный шаблон для опросов и сбора отзывов клиентов.", usageCount: 112 },
];

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || template.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Шаблоны</h1>
          <p className="text-muted-foreground mt-1">Просмотр и управление email-шаблонами</p>
        </div>
        <Button data-testid="button-create-template">
          <Plus className="w-4 h-4 mr-2" />
          Создать шаблон
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} {...template} />
            ))}
          </div>
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Шаблоны не найдены</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
