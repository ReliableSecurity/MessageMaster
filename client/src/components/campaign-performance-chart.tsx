import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartDataPoint {
  date: string;
  opened: number;
  clicked: number;
}

interface CampaignPerformanceChartProps {
  data: ChartDataPoint[];
}

export function CampaignPerformanceChart({ data }: CampaignPerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Campaign Performance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="opened"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Opened"
              dot={{ fill: "hsl(var(--chart-1))" }}
            />
            <Line
              type="monotone"
              dataKey="clicked"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Clicked"
              dot={{ fill: "hsl(var(--chart-2))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
