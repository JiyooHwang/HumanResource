import Link from "next/link";
import { LEAVE_REASON_LABEL, type Employee } from "@/lib/types";

export default function LeaveNotice({ employees }: { employees: Employee[] }) {
  const onLeave = employees.filter((e) => e.status === "on_leave");
  if (onLeave.length === 0) return null;

  return (
    <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h2 className="text-sm font-medium text-yellow-900 mb-2">
        현재 휴직자 {onLeave.length}명
      </h2>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {onLeave.map((e) => {
          const reason = e.leave_reason
            ? e.leave_reason === "other"
              ? e.leave_reason_detail || "기타"
              : LEAVE_REASON_LABEL[e.leave_reason]
            : null;
          return (
            <li key={e.id} className="text-yellow-900">
              <Link href={`/employees/${e.id}`} className="font-medium hover:underline">
                {e.name}
              </Link>
              <span className="text-yellow-800/80 ml-1">
                {reason && <>· {reason}</>}
                {(e.leave_start_date || e.leave_end_date) && (
                  <>
                    {" "}
                    ({e.leave_start_date ?? "?"} ~ {e.leave_end_date ?? "미정"})
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
