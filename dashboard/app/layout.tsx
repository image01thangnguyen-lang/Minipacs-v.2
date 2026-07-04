import "./globals.css";
import { DownloadManager } from "./components/DownloadManager";

export const metadata = {
  title: "Mini PACS Dashboard",
  description: "Next.js Admin & Worklist Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/api/favicon" />
      </head>
      <body>
        {children}
        <DownloadManager />
      </body>
    </html>
  );
}
