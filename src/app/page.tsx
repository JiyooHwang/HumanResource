import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: activeCount }, { count: resignedCount }, { data: recentHires }, { data: recentResigns }] =
    await Promise.all([
      supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "resigned"),
      supabase
        .from("employees")
        .select("id,name,department,hire_date")
        .eq("status", "active")
        .order("hire_date", { ascending: false, nullsFirst: false })
        .limit(5),
      supabase
        .from("employees")
        .select("id,name,department,resignation_date")
        .eq("status", "resigned")
        .order("resignation_date", { ascending: false, nullsFirst: false })
        .limit(5),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">대시보드</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="재직자" value={activeCount ?? 0} href="/employees?status=active" />
        <Card label="퇴직자" value={resignedCount ?? 0} href="/employees?status=resigned" />
        <Card label="전체 직원" value={(activeCount ?? 0) + (resignedCount ?? 0)} href="/employees" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="최근 입사">
          {recentHires && recentHires.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentHires.map((e) => (
                <li key={e.id} className="py-2 flex justify-between text-sm">
                  <Link href={`/employees/${e.id}`} className="text-gray-900 hover:underline">
                    {e.name} <span className="text-gray-400">· {e.department ?? "-"}</span>
                  </Link>
                  <span className="text-gray-500">{e.hire_date ?? "-"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">아직 없습니다.</p>
          )}
        </Panel>

        <Panel title="최근 퇴직">
          {recentResigns && recentResigns.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentResigns.map((e) => (
                <li key={e.id} className="py-2 flex justify-between text-sm">
                  <Link href={`/employees/${e.id}`} className="text-gray-900 hover:underline">
                    {e.name} <span className="text-gray-400">· {e.department ?? "-"}</span>
                  </Link>
                  <span className="text-gray-500">{e.resignation_date ?? "-"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">아직 없습니다.</p>
          )}
        </Panel>
      </div>

      <div className="flex gap-3">
        <Link
          href="/employees/new"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + 직원 등록
        </Link>
        <Link
          href="/employees"
          className="bg-white border border-gray-300 text-sm px-4 py-2 rounded-md hover:bg-gray-50"
        >
          직원 목록
        </Link>
      </div>
    </div>
  );
}

function Card({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </Link>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="font-medium mb-2">{title}</h2>
      {children}
    </section>
  );
}
