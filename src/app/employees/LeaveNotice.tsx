import Link from "next/link";
import { LEAVE_REASON_LABEL, type Employee } from "@/lib/types";

export default function LeaveNotice({ employees }: { employees: Employee[] }) {
  const onLeave = employees.filter((e) => e.status === "on_leave");
  if (onLeave.length === 0) return null;

  return (
    <section className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-yellow-200 text-sm font-medium text-yellow-900">
        현재 휴직자 {onLeave.length}명
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-100/60 text-yellow-900">
            <tr>
              <th className="text-left px-4 py-2 whitespace-nowrap">이름</th>
              <th className="text-left px-4 py-2 whitespace-nowrap">부서</th>
              <th className="text-left px-4 py-2 whitespace-nowrap">파트</th>
              <th className="text-left px-4 py-2 whitespace-nowrap">직급</th>
              <th className="text-left px-4 py-2 whitespace-nowrap">휴직 시작일</th>
              <th className="text-left px-4 py-2 whitespace-nowrap">휴직 종료(예정)일</th>
              <th className="text-left px-4 py-2 whitespace-nowrap">사유</th>
            </tr>
          </thead>
          <tbody>
            {onLeave.map((e) => {
              const reason = e.leave_reason
                ? e.leave_reason === "other"
                  ? e.leave_reason_detail || "기타"
                  : LEAVE_REASON_LABEL[e.leave_reason]
                : "-";
              return (
                <tr key={e.id} className="border-t border-yellow-200/60">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link
                      href={`/employees/${e.id}`}
                      className="text-yellow-900 font-medium hover:underline"
                    >
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-yellow-900">
                    {e.department ?? "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-yellow-900">
                    {e.part ?? "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-yellow-900">
                    {e.position ?? "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-yellow-900">
                    {e.leave_start_date ?? "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-yellow-900">
                    {e.leave_end_date ?? "미정"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-yellow-900">{reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
