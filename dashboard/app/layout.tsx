import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
