'use client';

import { useState } from 'react';
import { LineChart, BarChart, PieChart, ThemeProvider } from '@/components/charts';
import type { LineChartDataPoint, BarChartDataPoint, PieChartDataPoint } from '@/components/charts';

export default function ChartsDemoPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sample line chart data - revenue trend
  const lineChartData: LineChartDataPoint[] = [
    { date: '2024-01-01', value: 12000 },
    { date: '2024-01-02', value: 15000 },
    { date: '2024-01-03', value: 13500 },
    { date: '2024-01-04', value: 18000 },
    { date: '2024-01-05', value: 22000 },
    { date: '2024-01-06', value: 25000 },
    { date: '2024-01-07', value: 28000 },
  ];

  // Sample bar chart data - staff performance
  const barChartData: BarChartDataPoint[] = [
    { label: '理发师A', value: 45 },
    { label: '理发师B', value: 38 },
    { label: '理发师C', value: 52 },
    { label: '理发师D', value: 41 },
    { label: '理发师E', value: 35 },
  ];

  // Sample pie chart data - service distribution
  const pieChartData: PieChartDataPoint[] = [
    { label: '剪发', value: 120 },
    { label: '染发', value: 45 },
    { label: '烫发', value: 38 },
    { label: '护理', value: 25 },
    { label: '其他', value: 12 },
  ];

  return (
    <ThemeProvider attribute="class" defaultTheme={theme}>
      <div className={`min-h-screen p-8 transition-colors ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">图表组件库</h1>
              <p className="text-muted-foreground mt-2">响应式、主题自适应的数据可视化组件</p>
            </div>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              {theme === 'light' ? '🌙 深色' : '☀️ 浅色'}
            </button>
          </div>

          {/* Line Chart Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">折线图 (Line Chart)</h2>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-medium">收入趋势</h3>
                <p className="text-sm text-muted-foreground">展示近7天的收入变化</p>
              </div>
              <LineChart data={lineChartData} height={300} showArea={true} smooth={true} />
            </div>
          </section>

          {/* Bar Chart Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">柱状图 (Bar Chart)</h2>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-medium">员工业绩</h3>
                <p className="text-sm text-muted-foreground">各员工完成订单数对比</p>
              </div>
              <BarChart data={barChartData} height={300} showValues={true} />
            </div>

            {/* Horizontal Bar Chart */}
            <div className="mt-6 bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-medium">横向柱状图</h3>
                <p className="text-sm text-muted-foreground">适合长标签的数据展示</p>
              </div>
              <BarChart data={barChartData} height={250} horizontal={true} />
            </div>
          </section>

          {/* Pie Chart Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">饼图/环形图 (Pie/Donut Chart)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-medium">服务分布</h3>
                  <p className="text-sm text-muted-foreground">各服务类型占比</p>
                </div>
                <PieChart data={pieChartData} size={200} donut={false} />
              </div>

              {/* Donut Chart */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-medium">服务分布 (环形)</h3>
                  <p className="text-sm text-muted-foreground">带中心标签的环形图</p>
                </div>
                <PieChart
                  data={pieChartData}
                  size={200}
                  donut={true}
                  centerLabel="总订单"
                  centerValue="240"
                />
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">功能特性</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-lg font-medium mb-2">主题自适应</h3>
                <p className="text-sm text-muted-foreground">
                  自动适配深色/浅色主题，使用CSS变量实现平滑切换
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-lg font-medium mb-2">响应式设计</h3>
                <p className="text-sm text-muted-foreground">
                  根据屏幕尺寸自动调整图表密度和标签显示
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-lg font-medium mb-2">零依赖</h3>
                <p className="text-sm text-muted-foreground">
                  基于SVG原生实现，无需图表库，轻量高效
                </p>
              </div>
            </div>
          </section>

          {/* Usage Example */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">使用示例</h2>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`import { LineChart, BarChart, PieChart } from '@/components/charts';

// 折线图
<LineChart
  data={[
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 150 },
  ]}
  height={300}
  showArea={true}
  smooth={true}
/>

// 柱状图
<BarChart
  data={[
    { label: 'A', value: 45 },
    { label: 'B', value: 38 },
  ]}
  height={300}
  showValues={true}
/>

// 饼图
<PieChart
  data={[
    { label: 'A', value: 120 },
    { label: 'B', value: 45 },
  ]}
  size={200}
  donut={true}
  centerLabel="总计"
  centerValue="165"
/>`}</code>
              </pre>
            </div>
          </section>
        </div>
      </div>
    </ThemeProvider>
  );
}