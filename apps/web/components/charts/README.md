# Chart Components Library

A lightweight, responsive, theme-aware chart component library built with React and SVG.

## Features

- **Zero Dependencies**: Built with pure SVG, no heavy charting libraries
- **Theme Adaptive**: Automatically adapts to light/dark themes using CSS variables
- **Responsive**: Adjusts to screen sizes (mobile, tablet, desktop)
- **TypeScript**: Full type safety with exported interfaces
- **Customizable**: Extensive props for customization

## Installation

The library uses `next-themes` for theme detection. Install it first:

```bash
pnpm add next-themes
```

Wrap your app with the `ThemeProvider`:

```tsx
import { ThemeProvider } from '@/components/charts/theme-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Components

### LineChart

Displays trend data over time.

```tsx
import { LineChart } from '@/components/charts';

<LineChart
  data={[
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 150 },
  ]}
  height={300}
  showArea={true}
  smooth={true}
  color="primary"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `LineChartData[]` | required | Array of data points |
| `height` | `number` | `300` | Chart height in pixels |
| `showTooltip` | `boolean` | `true` | Show value tooltips |
| `showGrid` | `boolean` | `true` | Show grid lines |
| `showArea` | `boolean` | `true` | Fill area under line |
| `smooth` | `boolean` | `true` | Smooth bezier curve |
| `color` | `'primary' \| 'secondary' \| ...` | `'primary'` | Theme color key |
| `timeUnit` | `'day' \| 'week' \| 'month' \| 'year'` | `'day'` | Date format unit |
| `className` | `string` | `''` | Additional CSS classes |

**Data Format:**

```tsx
interface LineChartData {
  date: string;      // ISO date string
  value: number;     // Numeric value
  label?: string;    // Custom x-axis label (optional)
}
```

### BarChart

Displays comparative data with vertical or horizontal bars.

```tsx
import { BarChart } from '@/components/charts';

<BarChart
  data={[
    { label: 'A', value: 45 },
    { label: 'B', value: 38 },
  ]}
  height={300}
  showValues={true}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `BarChartData[]` | required | Array of data points |
| `height` | `number` | `300` | Chart height in pixels |
| `showGrid` | `boolean` | `true` | Show grid lines |
| `showValues` | `boolean` | `true` | Show value labels |
| `horizontal` | `boolean` | `false` | Horizontal orientation |
| `barWidth` | `number` | `auto` | Custom bar width |
| `className` | `string` | `''` | Additional CSS classes |

**Data Format:**

```tsx
interface BarChartData {
  label: string;           // Bar label
  value: number;          // Primary value
  color?: ThemeColorKey;  // Custom color (optional)
  secondaryValue?: number; // Secondary bar value (optional)
}
```

### PieChart

Displays proportional data as pie or donut chart.

```tsx
import { PieChart } from '@/components/charts';

<PieChart
  data={[
    { label: 'A', value: 120 },
    { label: 'B', value: 45 },
  ]}
  size={200}
  donut={true}
  centerLabel="总计"
  centerValue="165"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `PieChartData[]` | required | Array of data points |
| `size` | `number` | `200` | Chart size in pixels |
| `donut` | `boolean` | `true` | Donut style (vs pie) |
| `showLabels` | `boolean` | `true` | Show slice labels |
| `showLegend` | `boolean` | `true` | Show legend |
| `showPercentage` | `boolean` | `true` | Show percentage in legend |
| `centerLabel` | `string` | `undefined` | Donut center label |
| `centerValue` | `string` | `undefined` | Donut center value |
| `className` | `string` | `''` | Additional CSS classes |

**Data Format:**

```tsx
interface PieChartData {
  label: string;           // Slice label
  value: number;          // Numeric value
  color?: ThemeColorKey;  // Custom color (optional)
}
```

## Theme Colors

Charts use theme-defined colors. Available color keys:

- `primary`
- `secondary`
- `tertiary`
- `quaternary`
- `quinary`
- `senary`
- `septenary`
- `octonary`

## Utility Functions

The library includes helpful utilities in `@/lib/chart-utils`:

```tsx
import {
  formatCurrency,
  formatNumber,
  calculatePercentage,
  calculateGrowth,
  formatGrowth,
  aggregateByPeriod,
  fillMissingDates,
  formatDateLabel,
  getResponsiveDimensions,
  generateSmoothPath,
} from '@/lib/chart-utils';
```

## Responsive Behavior

Charts automatically adjust based on screen width:

- **Mobile (<640px)**: Reduced labels, compact layout
- **Tablet (640-1024px)**: Moderate label density
- **Desktop (>=1024px)**: Full labels and features

## Examples

See `/app/demo/charts/page.tsx` for interactive examples of all chart types with theme switching.

## Customization

### Custom Colors

```tsx
<PieChart
  data={[
    { label: 'Revenue', value: 100, color: 'primary' },
    { label: 'Expenses', value: 60, color: 'destructive' },
  ]}
/>
```

### Horizontal Bar Chart

```tsx
<BarChart
  data={[...]}
  horizontal={true}
  height={250}
/>
```

### Multi-series Bar Chart

```tsx
<BarChart
  data={[
    { label: 'A', value: 50, secondaryValue: 30 },
    { label: 'B', value: 40, secondaryValue: 45 },
  ]}
/>
```

## Browser Support

- Modern browsers with SVG support
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅