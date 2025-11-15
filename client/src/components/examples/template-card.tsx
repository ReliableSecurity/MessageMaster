import { TemplateCard } from "../template-card";

export default function TemplateCardExample() {
  return (
    <div className="p-8 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
        <TemplateCard
          id="1"
          name="Welcome Email"
          type="ready-made"
          description="A professional welcome email template for new subscribers with personalization options."
          usageCount={145}
        />
        <TemplateCard
          id="2"
          name="Product Launch"
          type="custom"
          description="Custom template designed for announcing new product releases with eye-catching visuals."
          usageCount={23}
        />
        <TemplateCard
          id="3"
          name="Newsletter Monthly"
          type="ready-made"
          description="Clean and modern newsletter template perfect for monthly updates and company news."
          usageCount={89}
        />
      </div>
    </div>
  );
}
