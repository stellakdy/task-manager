import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "할 일 관리 - Task Manager",
  description: "마감 임박도 시각화 기반 할 일 관리 앱",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Task Manager",
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const darkModeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var p = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && p)) document.documentElement.classList.add('dark');
  } catch(e){}
})();
`;

const swScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js');
  });
}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body className="bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
