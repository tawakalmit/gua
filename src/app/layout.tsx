import type { Metadata } from 'next';
import './globals.css';
import Taskbar from '@/components/Taskbar';

export const metadata: Metadata = {
  title: 'gua.my.id - Windows 95 URL Shortener',
  description:
    'Layanan pendekin URL gua.my.id dengan antarmuka klasik Windows 95. Dilengkapi fitur custom alias, QR Code generator, dan analitik pengunjung dengan Supabase.',
  keywords: ['windows 95 url shortener', 'gua.my.id', 'supabase', 'retro web', 'link tracker'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <main style={{ minHeight: 'calc(100vh - 42px)', padding: '16px 8px 60px 8px' }}>
          {children}
        </main>
        <Taskbar />
      </body>
    </html>
  );
}
