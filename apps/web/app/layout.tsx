import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'HaircutMS - 理发店管理系统',
  description: '理发店会员管理与收银系统',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
