import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

interface LinkData {
  url: string;
  clicks: number;
  uniqueClicks: number;
}

interface TopLinksTableProps {
  links: LinkData[];
}

export function TopLinksTable({ links }: TopLinksTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Популярные ссылки</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ссылка</TableHead>
              <TableHead className="text-right">Всего кликов</TableHead>
              <TableHead className="text-right">Уникальных</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-sm max-w-xs">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline truncate"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{link.url}</span>
                  </a>
                </TableCell>
                <TableCell className="text-right font-medium">{link.clicks}</TableCell>
                <TableCell className="text-right">{link.uniqueClicks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
