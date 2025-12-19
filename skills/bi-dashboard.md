---
name: bi-dashboard
description: UX/UI specialist for business intelligence dashboards, data visualization, KPIs, charts, and analytics interfaces. Uses Tremor, Recharts, Apache Superset.
---

# Business Intelligence Dashboard Skill

Expert in creating data-rich dashboards for business operations, analytics, and business intelligence tools.

## Quick Reference

| Library | Best For | GitHub Stars | Learning Curve |
|---------|----------|--------------|----------------|
| **Tremor** | Complete dashboard solution | 16k+ | Low |
| **Recharts** | Simple charts, fast setup | 24k+ | Low |
| **Nivo** | Feature-rich visualizations | 13k+ | Medium |
| **ECharts** | Big data, GPU-accelerated | 60k+ | Medium |
| **visx** | Custom visualizations | 19k+ | High |
| **Apache Superset** | Full BI platform | 63k+ | Medium |

---

## Stack Recommendations

### For React + Tailwind Projects (Recommended)

```bash
# Tremor - Complete dashboard components
npm install @tremor/react

# Dependencies
npm install tailwindcss @headlessui/react @floating-ui/react
```

### For Custom Visualizations

```bash
# Recharts - Simple, declarative charts
npm install recharts

# Nivo - Feature-rich with animations
npm install @nivo/core @nivo/bar @nivo/line @nivo/pie
```

### For Big Data / Real-time

```bash
# ECharts - GPU-accelerated, millions of points
npm install echarts echarts-for-react
```

---

## Tremor Components (Recommended)

### Setup Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tremor: {
          brand: {
            faint: '#eff6ff',
            muted: '#bfdbfe',
            subtle: '#60a5fa',
            DEFAULT: '#3b82f6',
            emphasis: '#1d4ed8',
            inverted: '#ffffff',
          },
        },
      },
    },
  },
  plugins: [],
};
```

### KPI Cards

```tsx
import { Card, Metric, Text, Flex, ProgressBar } from '@tremor/react';

export function KPICard({ title, metric, target, progress }: {
  title: string;
  metric: string;
  target: string;
  progress: number;
}) {
  return (
    <Card className="max-w-xs mx-auto">
      <Text>{title}</Text>
      <Metric>{metric}</Metric>
      <Flex className="mt-4">
        <Text>{progress}% of {target}</Text>
      </Flex>
      <ProgressBar value={progress} className="mt-2" />
    </Card>
  );
}
```

### Area Chart with Tremor

```tsx
import { Card, Title, AreaChart } from '@tremor/react';

const chartData = [
  { date: 'Jan', Sales: 2890, Profit: 1400 },
  { date: 'Feb', Sales: 3800, Profit: 2000 },
  { date: 'Mar', Sales: 3200, Profit: 1800 },
  { date: 'Apr', Sales: 4500, Profit: 2400 },
  { date: 'May', Sales: 4200, Profit: 2100 },
];

export function RevenueChart() {
  return (
    <Card>
      <Title>Revenue Overview</Title>
      <AreaChart
        className="h-72 mt-4"
        data={chartData}
        index="date"
        categories={['Sales', 'Profit']}
        colors={['blue', 'emerald']}
        valueFormatter={(value) => `$${value.toLocaleString()}`}
      />
    </Card>
  );
}
```

### Bar Chart Comparison

```tsx
import { Card, Title, BarChart, Subtitle } from '@tremor/react';

const data = [
  { name: 'Product A', 'Q1': 4000, 'Q2': 3000, 'Q3': 2000, 'Q4': 2780 },
  { name: 'Product B', 'Q1': 3000, 'Q2': 1398, 'Q3': 9800, 'Q4': 3908 },
  { name: 'Product C', 'Q1': 2000, 'Q2': 9800, 'Q3': 2000, 'Q4': 4800 },
];

export function QuarterlySales() {
  return (
    <Card>
      <Title>Quarterly Sales by Product</Title>
      <Subtitle>Revenue comparison across quarters</Subtitle>
      <BarChart
        className="mt-6"
        data={data}
        index="name"
        categories={['Q1', 'Q2', 'Q3', 'Q4']}
        colors={['blue', 'cyan', 'indigo', 'violet']}
        valueFormatter={(value) => `$${value.toLocaleString()}`}
        yAxisWidth={48}
      />
    </Card>
  );
}
```

### Donut Chart for Distribution

```tsx
import { Card, Title, DonutChart, Legend } from '@tremor/react';

const data = [
  { name: 'SaaS', value: 45 },
  { name: 'Services', value: 30 },
  { name: 'Licensing', value: 15 },
  { name: 'Other', value: 10 },
];

export function RevenueDistribution() {
  return (
    <Card className="max-w-lg">
      <Title>Revenue Distribution</Title>
      <DonutChart
        className="mt-6"
        data={data}
        category="value"
        index="name"
        colors={['blue', 'cyan', 'indigo', 'violet']}
        valueFormatter={(value) => `${value}%`}
      />
      <Legend
        className="mt-3"
        categories={['SaaS', 'Services', 'Licensing', 'Other']}
        colors={['blue', 'cyan', 'indigo', 'violet']}
      />
    </Card>
  );
}
```

---

## Recharts Examples

### Line Chart

```tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Jan', users: 4000, sessions: 2400 },
  { name: 'Feb', users: 3000, sessions: 1398 },
  { name: 'Mar', users: 2000, sessions: 9800 },
];

export function UserGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="users" stroke="#8884d8" />
        <Line type="monotone" dataKey="sessions" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Composed Chart (Mixed Types)

```tsx
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Jan', revenue: 590, profit: 800, margin: 0.8 },
  { name: 'Feb', revenue: 868, profit: 967, margin: 0.7 },
  { name: 'Mar', revenue: 1397, profit: 1098, margin: 0.65 },
];

export function FinancialOverview() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="revenue" fill="#413ea0" />
        <Bar yAxisId="left" dataKey="profit" fill="#ff7300" />
        <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#82ca9d" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

---

## ECharts for Big Data

```tsx
import ReactECharts from 'echarts-for-react';

export function RealTimeChart({ data }: { data: number[] }) {
  const option = {
    title: { text: 'Real-time Metrics' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((_, i) => i),
    },
    yAxis: { type: 'value' },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { start: 0, end: 100 },
    ],
    series: [
      {
        name: 'Value',
        type: 'line',
        smooth: true,
        data: data,
        areaStyle: {},
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
}
```

---

## Dashboard Layout Patterns

### Grid Layout with Cards

```tsx
import { Grid, Card, Col, Text, Metric } from '@tremor/react';

export function DashboardGrid() {
  return (
    <div className="p-6">
      {/* KPI Row */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card>
          <Text>Total Revenue</Text>
          <Metric>$12.4M</Metric>
        </Card>
        <Card>
          <Text>Active Users</Text>
          <Metric>23,456</Metric>
        </Card>
        <Card>
          <Text>Conversion Rate</Text>
          <Metric>3.2%</Metric>
        </Card>
        <Card>
          <Text>Avg Order Value</Text>
          <Metric>$127</Metric>
        </Card>
      </Grid>

      {/* Charts Row */}
      <Grid numItemsMd={2} className="gap-6 mt-6">
        <Col numColSpan={1}>
          <Card className="h-80">
            {/* Revenue Chart */}
          </Card>
        </Col>
        <Col numColSpan={1}>
          <Card className="h-80">
            {/* Distribution Chart */}
          </Card>
        </Col>
      </Grid>

      {/* Full Width Table */}
      <Card className="mt-6">
        {/* Data Table */}
      </Card>
    </div>
  );
}
```

### Tabbed Dashboard

```tsx
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';

export function TabbedDashboard() {
  return (
    <TabGroup>
      <TabList>
        <Tab>Overview</Tab>
        <Tab>Sales</Tab>
        <Tab>Operations</Tab>
        <Tab>Finance</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          {/* Overview content */}
        </TabPanel>
        <TabPanel>
          {/* Sales content */}
        </TabPanel>
        <TabPanel>
          {/* Operations content */}
        </TabPanel>
        <TabPanel>
          {/* Finance content */}
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
```

---

## Data Tables

### Sortable Table with Tremor

```tsx
import {
  Card, Table, TableHead, TableRow, TableHeaderCell,
  TableBody, TableCell, Text, Badge
} from '@tremor/react';

interface Transaction {
  id: string;
  customer: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

export function TransactionsTable({ data }: { data: Transaction[] }) {
  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Customer</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.customer}</TableCell>
              <TableCell>${item.amount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge color={
                  item.status === 'completed' ? 'emerald' :
                  item.status === 'pending' ? 'yellow' : 'red'
                }>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>{item.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
```

### TanStack Table for Advanced Features

```bash
npm install @tanstack/react-table
```

```tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

// Full-featured data table with sorting, filtering, pagination
```

---

## Apache Superset (Full BI Platform)

### Docker Deployment

```bash
# Clone Superset
git clone https://github.com/apache/superset.git
cd superset

# Run with Docker Compose
docker compose -f docker-compose-image-tag.yml up
```

### Access
- URL: http://localhost:8088
- Default credentials: admin/admin

### Features
- 40+ visualization types
- SQL IDE for ad-hoc queries
- Dashboard builder (drag & drop)
- Role-based access control
- Semantic layer for metrics
- Supports: PostgreSQL, MySQL, BigQuery, Snowflake, etc.

---

## Open Source BI Alternatives

| Platform | Self-Host | Key Feature |
|----------|-----------|-------------|
| **Apache Superset** | Yes | Full SQL BI platform |
| **Metabase** | Yes | Simple Q&A interface |
| **Redash** | Yes | SQL query & dashboards |
| **Grafana** | Yes | Time-series & monitoring |
| **Lightdash** | Yes | dbt integration |

---

## KPI Design Patterns

### KPI Card with Trend

```tsx
import { Card, Flex, Metric, Text, BadgeDelta } from '@tremor/react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface KPIWithTrendProps {
  title: string;
  value: string;
  change: number;
  changeText: string;
}

export function KPIWithTrend({ title, value, change, changeText }: KPIWithTrendProps) {
  const isPositive = change > 0;

  return (
    <Card>
      <Flex alignItems="start">
        <div>
          <Text>{title}</Text>
          <Metric>{value}</Metric>
        </div>
        <BadgeDelta
          deltaType={isPositive ? 'increase' : 'decrease'}
          isIncreasePositive={true}
          size="xs"
        >
          {Math.abs(change)}%
        </BadgeDelta>
      </Flex>
      <Text className="mt-2 text-gray-500">{changeText}</Text>
    </Card>
  );
}
```

### Sparkline KPI

```tsx
import { Card, Text, Metric, Flex } from '@tremor/react';
import { SparkAreaChart } from '@tremor/react';

const sparkData = [
  { month: 'Jan', value: 10 },
  { month: 'Feb', value: 20 },
  { month: 'Mar', value: 15 },
  { month: 'Apr', value: 25 },
];

export function SparklineKPI() {
  return (
    <Card className="max-w-xs">
      <Flex alignItems="center" justifyContent="between">
        <div>
          <Text>Monthly Revenue</Text>
          <Metric>$45,231</Metric>
        </div>
        <SparkAreaChart
          data={sparkData}
          categories={['value']}
          index="month"
          colors={['emerald']}
          className="h-10 w-20"
        />
      </Flex>
    </Card>
  );
}
```

---

## Color Palette for BI Dashboards

```typescript
// Recommended color schemes for data visualization

export const chartColors = {
  // Sequential (for single metric)
  sequential: ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'],

  // Diverging (for comparison)
  diverging: ['#ef4444', '#fbbf24', '#f3f4f6', '#34d399', '#059669'],

  // Categorical (for categories)
  categorical: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'],

  // Status colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    neutral: '#6b7280',
  },
};
```

---

## Dashboard Best Practices

### 1. Information Hierarchy
- Most important KPIs at the top
- Use card sizes to indicate importance
- Group related metrics together

### 2. Data Refresh
- Show "last updated" timestamp
- Use loading skeletons during refresh
- Implement real-time updates with WebSockets

### 3. Responsive Design
```tsx
<Grid numItemsSm={1} numItemsMd={2} numItemsLg={4}>
  {/* Cards automatically adjust */}
</Grid>
```

### 4. Accessibility
- Use colorblind-safe palettes
- Add ARIA labels to charts
- Provide data tables as alternative

### 5. Performance
- Virtualize large tables (react-virtual)
- Lazy load charts below fold
- Use memo for expensive computations

---

## Learning Resources

### Tableau-like Learning
- [Apache Superset Documentation](https://superset.apache.org/docs/intro)
- [Metabase Learn](https://www.metabase.com/learn)
- [Tremor Examples](https://www.tremor.so/docs/getting-started/introduction)

### Data Visualization Theory
- "The Visual Display of Quantitative Information" - Edward Tufte
- [Data Viz Project](https://datavizproject.com/)
- [From Data to Viz](https://www.data-to-viz.com/)

---

## Integration with Other Skills

- **supabase-expert**: Data source for dashboards
- **react-expert**: Component architecture
- **theming-darkmode**: Dashboard dark mode
- **multi-agent-patterns**: Data processing pipelines
- **pm-status**: Project analytics and RAG

---

*Use this skill when building: admin panels, analytics dashboards, reporting interfaces, KPI displays, business operations tools, or any data-heavy UI.*