import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Baladi AI — المساعد البلدي الذكي',
  description: 'مساعد ذكي متخصص في قانون البلديات اللبناني — لرؤساء البلديات والمجالس البلدية والقائمقامين والمحافظين',
  icons: { icon: '/logo.png', apple: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  )
}
