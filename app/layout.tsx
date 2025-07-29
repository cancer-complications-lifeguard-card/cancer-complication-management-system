import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import Header from '@/components/header';
import { ThemeProvider } from '@/contexts/theme-context';
import { siteConfig } from '@/lib/config';
import PWAClientWrapper from '@/components/pwa/pwa-client-wrapper';

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '癌症管理系统',
  },
  openGraph: {
    type: 'website',
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ]
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-background text-foreground">
        <ThemeProvider>
          <SWRConfig
            value={{
              fallback: {
                // We do NOT await here
                // Only components that read this data will suspend
                '/api/user': getUser()
              }
            }}
          >
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                <PWAClientWrapper />
                {children}
              </main>
            </div>
          </SWRConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
