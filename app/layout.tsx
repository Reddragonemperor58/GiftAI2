import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'GiftAI - AI-Powered Gift Recommendations',
  description: 'Find the perfect gift with AI-powered recommendations tailored to your recipient',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}