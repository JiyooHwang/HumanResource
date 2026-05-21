"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_ONBOARDING_TASKS,
  LEAVE_REASON_LABEL_TO_VALUE,
  type EmployeeStatus,
  type LeaveReason,
} from "@/lib/types";

type Row = {
  사번?: string;
  이름?: string;
  이메일?: string;
  연락처?: string;
  부서?: string;
  파트?: string;
  직급?: string;
  입사일?: string;
  퇴사일?: string;
  상태?: string;
  휴직시작일?: string;
  휴직종료일?: string;
  휴직사유?: string;
  휴직사유상세?: string;
  메모?: string;
};

type ParsedEmployee = {
  ok: boolean;
  error?: string;
  data: {
    employee_number: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    department: string | null;
    part: string | null;
    position: string | null;
    hire_date: string | null;
    resignation_date: string | null;
    status: EmployeeStatus;
    leave_start_date: string | null;
    leave_end_date: string | null;
    leave_reason: LeaveReason | null;
    leave_reason_detail: string | null;
    notes: string | null;
  };
};

const STATUS_MAP: Record<string, EmployeeStatus> = {
  재직: "active",
  active: "active",
  휴직: "on_leave",
  on_leave: "on_leave",
  퇴직: "resigned",
  resigned: "resigned",
};

function normalizeDate(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  // xlsx 가 Date 객체로 변환한 경우
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  if (!s) return null;
  // 2024-01-15 / 2024/01/15 / 2024.01.15
  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  return s; // 그대로 시도 (Supabase가 거부하면 에러로 표시)
}

function parseRow(row: Row, index: number): ParsedEmployee {
  const name = (row.이름 ?? "").toString().trim();
  if (!name) {
    return {
      ok: false,
      error: `${index + 2}행: 이름이 비어 있음`,
      data: null as never,
    };
  }
  const statusRaw = (row.상태 ?? "").toString().trim();
  const status: EmployeeStatus = STATUS_MAP[statusRaw] ?? "active";
  const isLeave = status === "on_leave";
  const leaveReasonRaw = (row.휴직사유 ?? "").toString().trim();
  const leaveReason: LeaveReason | null = isLeave
    ? LEAVE_REASON_LABEL_TO_VALUE[leaveReasonRaw] ?? null
    : null;
  return {
    ok: true,
    data: {
      employee_number: row.사번?.toString().trim() || null,
      name,
      email: row.이메일?.toString().trim() || null,
      phone: row.연락처?.toString().trim() || null,
      department: row.부서?.toString().trim() || null,
      part: row.파트?.toString().trim() || null,
      position: row.직급?.toString().trim() || null,
      hire_date: normalizeDate(row.입사일),
      resignation_date: normalizeDate(row.퇴사일),
      status,
      leave_start_date: isLeave ? normalizeDate(row.휴직시작일) : null,
      leave_end_date: isLeave ? normalizeDate(row.휴직종료일) : null,
      leave_reason: leaveReason,
      leave_reason_detail:
        isLeave && leaveReason === "other"
          ? row.휴직사유상세?.toString().trim() || null
          : null,
      notes: row.메모?.toString().trim() || null,
    },
  };
}

export default function ImportPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ParsedEmployee[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [seedOnboarding, setSeedOnboarding] = useState(true);
  const [importing, setImporting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  async function handleFile(file: File) {
    setResultMsg(null);
    setFileName(file.name);

    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });

    const parsed = json.map((r, i) => parseRow(r, i));
    setRows(parsed);
  }

  function downloadTemplate() {
    const headers = [
      "사번",
      "이름",
      "이메일",
      "연락처",
      "부서",
      "파트",
      "직급",
      "입사일",
      "퇴사일",
      "상태",
      "휴직시작일",
      "휴직종료일",
      "휴직사유",
      "휴직사유상세",
      "메모",
    ];
    const sample = [
      "EMP001",
      "홍길동",
      "hong@example.com",
      "010-1234-5678",
      "modeling",
      "1파트",
      "사원",
      "2025-01-15",
      "",
      "재직",
      "",
      "",
      "",
      "",
      "",
    ];
    const csv =
      "﻿" +
      headers.join(",") +
      "\n" +
      sample.join(",") +
      "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function doImport() {
    const valid = rows.filter((r) => r.ok).map((r) => r.data);
    if (valid.length === 0) {
      setResultMsg("등록할 행이 없습니다.");
      return;
    }
    setImporting(true);
    setResultMsg(null);

    const { data: inserted, error } = await supabase
      .from("employees")
      .insert(valid)
      .select("id");

    if (error || !inserted) {
      setImporting(false);
      setResultMsg(`오류: ${error?.message ?? "알 수 없는 오류"}`);
      return;
    }

    if (seedOnboarding) {
      const tasks = inserted.flatMap((e) =>
        DEFAULT_ONBOARDING_TASKS.map((task, i) => ({
          employee_id: e.id,
          kind: "onboarding" as const,
          task,
          sort_order: i,
        })),
      );
      if (tasks.length > 0) {
        await supabase.from("checklist_items").insert(tasks);
      }
    }

    setImporting(false);
    setResultMsg(`${inserted.length}명 등록 완료`);
    setTimeout(() => router.push("/employees"), 800);
  }

  const okCount = rows.filter((r) => r.ok).length;
  const errCount = rows.length - okCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">엑셀로 일괄 등록</h1>
        <Link href="/employees" className="text-sm text-gray-500 hover:text-gray-700">
          ← 직원 목록
        </Link>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-700">
            <strong>.xlsx</strong> 또는 <strong>.csv</strong> 파일을 업로드하세요.
            첫 행은 헤더여야 하며, 컬럼명은 한국어 기준입니다.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            필수: <code>이름</code> · 선택: <code>사번, 이메일, 연락처, 부서, 파트, 직급, 입사일, 퇴사일, 상태, 휴직시작일, 휴직종료일, 휴직사유, 휴직사유상세, 메모</code>
            <br />
            상태 값: <code>재직</code>, <code>휴직</code>, <code>퇴직</code> (비우면 재직)
            <br />
            휴직사유 값: <code>육아</code>, <code>출산</code>, <code>무급</code>, <code>기타</code> (상태가 휴직일 때만 사용; 기타 선택 시 휴직사유상세에 직접 입력)
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <label className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer inline-block">
            파일 선택
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
          <button
            type="button"
            onClick={downloadTemplate}
            className="bg-white border border-gray-300 text-sm px-4 py-2 rounded-md hover:bg-gray-50"
          >
            템플릿 다운로드
          </button>
          {fileName && <span className="text-sm text-gray-600">{fileName}</span>}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="!w-auto"
            checked={seedOnboarding}
            onChange={(e) => setSeedOnboarding(e.target.checked)}
          />
          등록된 각 직원에 입사 체크리스트 기본 항목 자동 추가
        </label>
      </section>

      {rows.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm">
              총 {rows.length}행 · <span className="text-green-700">정상 {okCount}</span>
              {errCount > 0 && (
                <span className="text-red-700"> · 오류 {errCount}</span>
              )}
            </div>
            <button
              type="button"
              disabled={importing || okCount === 0}
              onClick={doImport}
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-60"
            >
              {importing ? "등록 중..." : `${okCount}명 등록`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">상태</th>
                  <th className="text-left px-3 py-2">이름</th>
                  <th className="text-left px-3 py-2">사번</th>
                  <th className="text-left px-3 py-2">부서</th>
                  <th className="text-left px-3 py-2">직급</th>
                  <th className="text-left px-3 py-2">입사일</th>
                  <th className="text-left px-3 py-2">재직상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t border-gray-100 ${r.ok ? "" : "bg-red-50"}`}
                  >
                    <td className="px-3 py-2 text-gray-500">{i + 2}</td>
                    <td className="px-3 py-2">
                      {r.ok ? (
                        <span className="text-green-700 text-xs">정상</span>
                      ) : (
                        <span className="text-red-700 text-xs" title={r.error}>
                          오류
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{r.data?.name ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.employee_number ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.department ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.position ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.hire_date ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.status ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {resultMsg && (
        <div className="text-sm bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md">
          {resultMsg}
        </div>
      )}
    </div>
  );
}
