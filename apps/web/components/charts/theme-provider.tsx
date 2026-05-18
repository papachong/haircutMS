'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * Theme Provider Component
 *
 * Wraps the application to provide theme context for chart components.
 * Place this at the root of your app or dashboard.
 *
 * @example
 * ```tsx
 * import { ThemeProvider } from '@/components/charts/theme-provider';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ThemeProvider attribute="class" defaultTheme="light">
 *           {children}
 *         </ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export type { ThemeProviderProps } from 'next-themes';