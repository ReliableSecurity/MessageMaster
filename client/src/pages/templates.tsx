import { useState } from "react";
import { TemplateCard } from "@/components/template-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";

const mockTemplates = [
  { id: "1", name: "Welcome Email", type: "ready-made" as const, description: "A professional welcome email template for new subscribers with personalization options.", usageCount: 145 },
  { id: "2", name: "Product Launch", type: "custom" as const, description: "Custom template designed for announcing new product releases with eye-catching visuals.", usageCount: 23 },
  { id: "3", name: "Newsletter Monthly", type: "ready-made" as const, description: "Clean and modern newsletter template perfect for monthly updates and company news.", usageCount: 89 },
  { id: "4", name: "Promotional Sale", type: "ready-made" as const, description: "Eye-catching template for promotional campaigns and special offers.", usageCount: 234 },
  { id: "5", name: "Event Invitation", type: "custom" as const, description: "Custom designed invitation template for webinars and events.", usageCount: 56 },
  { id: "6", name: "Survey Request", type: "ready-made" as const, description: "Professional template for customer feedback and survey requests.", usageCount: 112 },
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
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-1">Browse and manage your email templates</p>
        </div>
        <Button data-testid="button-create-template">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-templates"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Templates</TabsTrigger>
          <TabsTrigger value="ready-made" data-testid="tab-ready-made">Ready-made</TabsTrigger>
          <TabsTrigger value="custom" data-testid="tab-custom">Custom</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} {...template} />
            ))}
          </div>
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No templates found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
