import { TopLinksTable } from "../top-links-table";

const mockLinks = [
  { url: "https://example.com/spring-sale", clicks: 1245, uniqueClicks: 892 },
  { url: "https://example.com/new-products", clicks: 987, uniqueClicks: 743 },
  { url: "https://example.com/blog/latest", clicks: 654, uniqueClicks: 512 },
  { url: "https://example.com/pricing", clicks: 432, uniqueClicks: 389 },
  { url: "https://example.com/contact", clicks: 289, uniqueClicks: 234 },
];

export default function TopLinksTableExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-4xl">
        <TopLinksTable links={mockLinks} />
      </div>
    </div>
  );
}
