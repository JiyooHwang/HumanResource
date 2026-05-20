import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem, Employee, LeaveHistory } from "@/lib/types";
import EmployeeEditor from "./EmployeeEditor";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: employee }, { data: checklist }, { data: leaveHistory }] = await Promise.all([
    supabase.from("employees").select("*").eq("id", id).single(),
    supabase
      .from("checklist_items")
      .select("*")
      .eq("employee_id", id)
      .order("kind", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("leave_history")
      .select("*")
      .eq("employee_id", id)
      .order("start_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  if (!employee) return notFound();

  return (
    <div className="space-y-4">
      <Link href="/employees" className="text-sm text-gray-500 hover:text-gray-700">
        ← 직원 목록
      </Link>
      <EmployeeEditor
        employee={employee as Employee}
        checklist={(checklist ?? []) as ChecklistItem[]}
        leaveHistory={(leaveHistory ?? []) as LeaveHistory[]}
      />
    </div>
  );
}
