import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "인력 관리",
  description: "입퇴사 관리 도구",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ko">
      <body>
        {user && <Nav email={user.email ?? ""} />}
        <main className="w-full px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
