#!/bin/bash

# ==============================================================================
# MINI PACS V2 - FRONTEND INITIALIZATION & HEALING SCRIPT
# ==============================================================================
# Tự động khởi tạo và phục hồi toàn bộ mã nguồn Next.js PACS Dashboard
# nếu bị thiếu khi tải từ repo Git trắng hoặc mới.
# ==============================================================================

set -e

# Màu sắc hiển thị console
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[Frontend Self-Healing] Đang kiểm tra mã nguồn UI Dashboard...${NC}"

DASHBOARD_DIR="./dashboard"

# Khai báo hàm ghi file nếu file chưa tồn tại để tránh ghi đè code sửa đổi của người dùng
write_if_missing() {
    local filepath="$1"
    local content_var="$2"
    
    mkdir -p "$(dirname "$filepath")"
    if [ ! -f "$filepath" ]; then
        echo -e "  - Đang tạo: $filepath"
        cat << 'EOF' > "$filepath"
_CONTENT_REPLACE_
EOF
        # Thay thế placeholder bằng nội dung thực tế
        sed -i 's/_CONTENT_REPLACE_//g' "$filepath" # clear placeholder
        echo "$content_var" > "$filepath"
    fi
}

# 1. Tạo các thư mục cần thiết
mkdir -p "$DASHBOARD_DIR/app/api/auth/[...nextauth]"
mkdir -p "$DASHBOARD_DIR/app/login"
mkdir -p "$DASHBOARD_DIR/app/admin"
mkdir -p "$DASHBOARD_DIR/app/report/[studyInstanceUid]"
mkdir -p "$DASHBOARD_DIR/app/worklist/new"
mkdir -p "$DASHBOARD_DIR/prisma"

# 2. Tạo / Đồng bộ cấu hình package.json (Đảm bảo React 18 sạch sẽ và tương thích)
echo -e "${GREEN}  -> Kiểm tra và đồng bộ package.json...${NC}"
cat << 'EOF' > "$DASHBOARD_DIR/package.json"
{
  "name": "minipacs-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.4.0",
    "@prisma/client": "^5.22.0",
    "@tiptap/react": "^3.27.0",
    "@tiptap/starter-kit": "^3.27.0",
    "@tiptap/extension-image": "^3.27.0",
    "bcryptjs": "^2.4.3",
    "lucide-react": "^0.378.0",
    "next": "^14.2.3",
    "next-auth": "5.0.0-beta.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.51.4",
    "react-to-print": "^3.3.0",
    "zod": "^3.23.8",
    "tailwindcss": "3.4.3",
    "postcss": "8.4.38",
    "autoprefixer": "10.4.19"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.12.12",
    "@types/react": "^18.3.2",
    "@types/react-dom": "^18.3.0",
    "prisma": "^5.22.0",
    "typescript": "^5.4.5"
  }
}
EOF

# 3. Tạo / Đồng bộ Dockerfile (Đảm bảo có --legacy-peer-deps và node:18-alpine / node:20-alpine)
echo -e "${GREEN}  -> Kiểm tra và đồng bộ Dockerfile...${NC}"
cat << 'EOF' > "$DASHBOARD_DIR/Dockerfile"
FROM node:18-alpine

WORKDIR /app

# Copy các file cấu trúc package
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt dependency tránh xung đột peer deps
RUN npm install --legacy-peer-deps

# Copy toàn bộ mã nguồn
COPY . .

# Generate Client Prisma và build Next.js
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF

# 4. Tạo tsconfig.json
if [ ! -f "$DASHBOARD_DIR/tsconfig.json" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/tsconfig.json"
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
fi

# 5. Tạo tailwind.config.js và postcss.config.js
if [ ! -f "$DASHBOARD_DIR/tailwind.config.js" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/tailwind.config.js"
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF
fi

if [ ! -f "$DASHBOARD_DIR/postcss.config.js" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/postcss.config.js"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
fi

# 6. Tạo file schema.prisma
if [ ! -f "$DASHBOARD_DIR/prisma/schema.prisma" ]; then
    echo -e "${GREEN}  -> Khởi tạo Database Schema (Prisma)...${NC}"
    cat << 'EOF' > "$DASHBOARD_DIR/prisma/schema.prisma"
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ReportStatus {
  UNREAD
  DRAFTING
  COMPLETED
}

model Report {
  id               String       @id @default(uuid())
  studyInstanceUid String       @unique
  status           ReportStatus @default(UNREAD)
  findings         String?      @db.Text
  conclusion       String?      @db.Text
  recommendation   String?      @db.Text
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@map("reports")
}

enum Role {
  ADMIN
  DOCTOR
  RECEPTION
}

model User {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String
  fullName  String
  role      Role     @default(DOCTOR)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model PrintTemplate {
  id          String   @id @default(uuid())
  name        String
  htmlContent String   @db.Text
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("print_templates")
}

model WorklistOrder {
  id               String   @id @default(uuid())
  patientName      String
  patientId        String
  dob              DateTime?
  gender           String?   // M, F, O
  referringPhysician String?
  modality         String
  accessionNumber  String   @unique
  scheduledDate    DateTime @default(now())
  status           String   @default("PENDING")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("worklist_orders")
}
EOF
fi

# 7. Tạo file Auth & Middleware của NextAuth
if [ ! -f "$DASHBOARD_DIR/auth.ts" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/auth.ts"
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string }
        });
        if (!user) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return {
          id: user.id,
          name: user.fullName,
          username: user.username,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  }
});
EOF
fi

if [ ! -f "$DASHBOARD_DIR/middleware.ts" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/middleware.ts"
import { NextResponse } from "next/server";
import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.startsWith('/login');

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
EOF
fi

if [ ! -f "$DASHBOARD_DIR/next-auth.d.ts" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/next-auth.d.ts"
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    username?: string;
  }
}
EOF
fi

# 8. Tạo DB Client
if [ ! -f "$DASHBOARD_DIR/app/db.ts" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/app/db.ts"
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOF
fi

# 9. Gốc CSS và Layout
if [ ! -f "$DASHBOARD_DIR/app/globals.css" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/app/globals.css"
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 255, 255, 255;
  --background-start-rgb: 10, 10, 12;
  --background-end-rgb: 0, 0, 0;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
EOF
fi

if [ ! -f "$DASHBOARD_DIR/app/layout.tsx" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/app/layout.tsx"
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF
fi

# 10. API Auth, Server Actions, Trang Login và Worklist Order
if [ ! -f "$DASHBOARD_DIR/app/api/auth/[...nextauth]/route.ts" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/app/api/auth/[...nextauth]/route.ts"
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
EOF
fi

if [ ! -f "$DASHBOARD_DIR/app/actions.ts" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/app/actions.ts"
'use server'

export async function getStudies() {
  const orthancUrl = process.env.ORTHANC_API_URL || 'http://orthanc:8042';
  const username = process.env.ORTHANC_USERNAME || 'admin';
  const password = process.env.ORTHANC_PASSWORD || 'admin_password';

  try {
    const response = await fetch(`${orthancUrl}/studies?expand`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`Orthanc error: ${response.status} ${response.statusText}`);
      return [];
    }

    const studies = await response.json();
    const enrichedStudies = await Promise.all(studies.map(async (study: any) => {
      let modality = study.MainDicomTags?.Modality || 'UNKNOWN';
      let instancesCount = 0;

      if (modality === 'UNKNOWN' && study.Series && study.Series.length > 0) {
        if (typeof study.Series[0] === 'string') {
          try {
             const seriesRes = await fetch(`${orthancUrl}/series/${study.Series[0]}`, {
               headers: {
                 'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
                 'Accept': 'application/json'
               },
               cache: 'no-store'
             });
             if (seriesRes.ok) {
               const seriesData = await seriesRes.json();
               modality = seriesData.MainDicomTags?.Modality || 'UNKNOWN';
             }
           } catch (e) {
             console.error("Failed to fetch series for modality:", e);
           }
        }
      }

      try {
        const statsRes = await fetch(`${orthancUrl}/studies/${study.ID}/statistics`, {
           headers: {
             'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
             'Accept': 'application/json'
           },
           cache: 'no-store'
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          instancesCount = statsData.CountInstances || 0;
        }
      } catch (e) {
        console.error("Failed to fetch study statistics:", e);
      }

      return {
        ...study,
        EnrichedModality: modality,
        EnrichedInstancesCount: instancesCount
      };
    }));

    return enrichedStudies;
  } catch (error) {
    console.error('Failed to fetch from Orthanc:', error);
    return [];
  }
}
EOF
fi

if [ ! -f "$DASHBOARD_DIR/app/login/page.tsx" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/app/login/page.tsx"
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, Boxes, Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError("Đã xảy ra lỗi hệ thống");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl mb-4 shadow-lg ring-1 ring-blue-500/50">
            <Boxes className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Mini PACS</h1>
          <p className="text-slate-400 mt-2 text-sm">Hệ thống lưu trữ & truyền tải hình ảnh Y Tế</p>
        </div>

        <div className="bg-[#0f0f13]/80 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tên đăng nhập</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="block w-full px-4 py-3 bg-[#141419] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập username"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full px-4 py-3 bg-[#141419] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50 mt-6"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5 text-white" /> : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
EOF
fi

if [ ! -f "$DASHBOARD_DIR/app/worklist/actions.ts" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/app/worklist/actions.ts"
"use server";

import { prisma } from "@/app/db";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

export const worklistSchema = z.object({
  patientName: z.string().min(1, "Vui lòng nhập tên bệnh nhân"),
  patientId: z.string().min(1, "Vui lòng nhập mã bệnh nhân"),
  dob: z.string().optional(),
  gender: z.string().optional(),
  referringPhysician: z.string().optional(),
  modality: z.string().min(1, "Vui lòng chọn loại máy chụp"),
});

export async function createWorklistAction(data: z.infer<typeof worklistSchema>) {
  try {
    const validatedData = worklistSchema.parse(data);
    const timestamp = new Date().getTime().toString().slice(-6);
    const accessionNumber = `ACC${timestamp}${Math.floor(Math.random() * 1000)}`;
    const dobDate = validatedData.dob ? new Date(validatedData.dob) : new Date("1900-01-01");
    const dicomDob = validatedData.dob ? validatedData.dob.replace(/-/g, "") : "";

    const order = await prisma.worklistOrder.create({
      data: {
        patientName: validatedData.patientName,
        patientId: validatedData.patientId,
        dob: dobDate,
        gender: validatedData.gender,
        referringPhysician: validatedData.referringPhysician,
        modality: validatedData.modality,
        accessionNumber,
      }
    });

    const dicomJson = {
        "0010,0010": validatedData.patientName,
        "0010,0020": validatedData.patientId,
        "0010,0030": dicomDob,
        "0010,0040": validatedData.gender || "O",
        "0008,0050": accessionNumber,
        "0008,0090": validatedData.referringPhysician || "",
        "0040,0100": [{
          "0008,0060": validatedData.modality,
          "0040,0001": "AETITLE",
          "0040,0002": new Date().toISOString().slice(0,10).replace(/-/g, ""),
          "0040,0003": "000000.000",
          "0040,0006": "Dr. " + (validatedData.referringPhysician || ""),
          "0040,0007": "Study_" + accessionNumber,
          "0040,0009": "STEP_" + accessionNumber
        }],
        "0020,000D": "1.2.840.113619.2." + timestamp + "." + accessionNumber,
        "0040,1001": accessionNumber,
        "0032,1060": "Routine procedure"
    };

    const rootPath = process.cwd();
    const worklistsDir = path.join(rootPath, "pacs_data", "worklists");

    await fs.mkdir(worklistsDir, { recursive: true });
    const filePath = path.join(worklistsDir, `${accessionNumber}.wl.json`);
    await fs.writeFile(filePath, JSON.stringify(dicomJson, null, 2), "utf8");

    return { success: true, accessionNumber };
  } catch (err: any) {
    console.error("Error creating worklist:", err);
    return { success: false, error: err.message };
  }
}
EOF
fi

if [ ! -f "$DASHBOARD_DIR/app/worklist/new/page.tsx" ]; then
    cat << 'EOF' > "$DASHBOARD_DIR/app/worklist/new/page.tsx"
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWorklistAction, worklistSchema } from "../actions";
import { z } from "zod";
import { useState } from "react";
import { Loader2, PlusCircle, CheckCircle2, AlertCircle } from "lucide-react";

type FormValues = z.infer<typeof worklistSchema>;

export default function NewWorklistPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(worklistSchema),
    defaultValues: {
      patientName: "",
      patientId: "",
      dob: "",
      gender: "O",
      referringPhysician: "",
      modality: "CR",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await createWorklistAction(data);
      if (res.success) {
        setSuccessMsg(`Tạo Order thành công! Accession: ${res.accessionNumber}`);
        reset();
      } else {
        setErrorMsg(res.error || "Có lỗi xảy ra");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-8 sm:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <PlusCircle className="text-blue-500 h-8 w-8" />
            Tạo ca chụp mới
          </h1>
          <p className="text-slate-400 mt-2">
            Tạo Modality Worklist Order (MWL). Thông tin sẽ được gửi tới máy chụp X-quang/Siêu âm.
          </p>
        </div>

        <div className="bg-[#0d0d0f] border border-slate-800 rounded-2xl p-8 shadow-xl">
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase">Tên Bệnh Nhân *</label>
                <input
                  {...register("patientName")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: NGUYEN VAN A"
                />
                {errors.patientName && <p className="text-red-400 text-xs mt-1">{errors.patientName.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase">Mã Bệnh Nhân (PID) *</label>
                <input
                  {...register("patientId")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="VD: PID-12345"
                />
                {errors.patientId && <p className="text-red-400 text-xs mt-1">{errors.patientId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase">Ngày Sinh</label>
                <input
                  type="date"
                  {...register("dob")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase">Giới tính</label>
                <select
                  {...register("gender")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="M">Nam</option>
                  <option value="F">Nữ</option>
                  <option value="O">Khác</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase">Bác sĩ chỉ định</label>
                <input
                  {...register("referringPhysician")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: bs_tuan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 uppercase">Loại máy chụp *</label>
                <select
                  {...register("modality")}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  <option value="CR">CR (X-quang số hóa)</option>
                  <option value="DX">DX (X-quang kỹ thuật số)</option>
                  <option value="US">US (Siêu âm)</option>
                  <option value="CT">CT (Cắt lớp vi tính)</option>
                  <option value="MR">MR (Cộng hưởng từ)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                Tạo Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
EOF
fi

echo -e "${GREEN}[Frontend Self-Healing] Hoàn thành tối ưu hóa và phục hồi mã nguồn UI Dashboard!${NC}"
