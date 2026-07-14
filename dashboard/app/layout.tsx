import "./globals.css";
import { DownloadManager } from "./components/DownloadManager";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AntdProvider } from "./providers/AntdProvider";

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
    <html lang="vi">
      <head>
        <link rel="icon" href="/api/favicon" />
      </head>
      <body>
        <AntdRegistry>
          <AntdProvider>
            {children}
            <DownloadManager />
          </AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
