import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "할 일 관리",
  description: "마감 임박도 시각화 기반 할 일 관리 앱",
};

// 다크모드 FOUC 방지: React 렌더 전에 클래스 적용
const darkModeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var p = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && p)) document.documentElement.classList.add('dark');
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body className="bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
