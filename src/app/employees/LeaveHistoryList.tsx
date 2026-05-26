import { createClient } from "@/lib/supabase/server";
import { LEAVE_REASON_LABEL, type LeaveReason } from "@/lib/types";

type HistoryRow = {
  id: string;
  start_date: string | null;
  end_date: string | null;
  reason: LeaveReason | null;
  reason_detail: string | null;
  created_at: string;
  employee_name: string | null;
  employee_dept: string | null;
};

export default async function LeaveHistoryList() {
  const supabase = await createClient();

  const { data: historyData } = await supabase
    .from("leave_history")
    .select("id, employee_id, start_date, end_date, reason, reason_detail, created_at")
    .order("end_date", { ascending: false, nullsFirst: false })
    .order("start_date", { ascending: false, nullsFirst: false })
    .limit(200);

  if (!historyData || historyData.length === 0) return null;

  const empIds = [...new Set(historyData.map((h) => h.employee_id))];
  const { data: empData } = await supabase
    .from("employees")
    .select("id, name, department")
    .in("id", empIds);

  const empMap = new Map(
    (empData ?? []).map((e) => [e.id, { name: e.name, department: e.department }]),
  );

  const rows: HistoryRow[] = historyData.map((h) => {
    const emp = empMap.get(h.employee_id);
    return {
      ...h,
      employee_name: emp?.name ?? "-",
      employee_dept: emp?.department ?? "-",
    };
  });
  if (rows.length === 0) return null;

  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="font-medium">과거 휴직 이력 ({rows.length}건)</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">성명</th>
              <th className="text-left px-4 py-2">소속</th>
              <th className="text-left px-4 py-2">휴직 시작일</th>
              <th className="text-left px-4 py-2">휴직 종료일</th>
              <th className="text-left px-4 py-2">사유</th>
              <th className="text-left px-4 py-2">기록일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{h.employee_name}</td>
                <td className="px-4 py-2 text-gray-700">{h.employee_dept}</td>
                <td className="px-4 py-2 text-gray-700">{h.start_date ?? "-"}</td>
                <td className="px-4 py-2 text-gray-700">{h.end_date ?? "-"}</td>
                <td className="px-4 py-2 text-gray-700">
                  {h.reason === "other"
                    ? h.reason_detail || "기타"
                    : h.reason
                      ? LEAVE_REASON_LABEL[h.reason]
                      : "-"}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {new Date(h.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
