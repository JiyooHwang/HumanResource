"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_ONBOARDING_TASKS,
  LEAVE_REASON_LABEL_TO_VALUE,
  type EmployeeStatus,
  type LeaveReason,
} from "@/lib/types";

type Row = Record<string, unknown>;

type ParsedEmployee = {
  ok: boolean;
  error?: string;
  duplicate?: boolean;
  existingId?: string;
  data: {
    employee_number: string | null;
    name: string;
    headquarters: string | null;
    email: string | null;
    personal_email: string | null;
    phone: string | null;
    department: string | null;
    part: string | null;
    position: string | null;
    work_location: string | null;
    hire_date: string | null;
    first_work_date: string | null;
    resignation_date: string | null;
    last_work_date: string | null;
    status: EmployeeStatus;
    leave_start_date: string | null;
    leave_end_date: string | null;
    leave_reason: LeaveReason | null;
    leave_reason_detail: string | null;
    return_from_leave_date: string | null;
    badge_card_returned: string | null;
    notes: string | null;
  };
};

const STATUS_MAP: Record<string, EmployeeStatus> = {
  재직: "active",
  active: "active",
  입사: "active",
  복직: "active",
  "정규직 전환": "active",
  "정규직전환": "active",
  휴직: "on_leave",
  on_leave: "on_leave",
  무급: "on_leave",
  무급가: "on_leave",
  "무급휴가": "on_leave",
  "무급휴직": "on_leave",
  퇴직: "resigned",
  퇴사: "resigned",
  resigned: "resigned",
};

// "-", "—", 빈 문자열, 공백 등은 모두 null로 처리
function cleanString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = v.toString().trim();
  if (!s) return null;
  if (s === "-" || s === "—" || s === "ㅡ" || s === "N/A" || s === "n/a") return null;
  return s;
}

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

// 컬럼명 변형에 유연하게 대응 (공백/슬래시/약어 무시)
function col(row: Row, ...candidates: string[]): unknown {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c];
  }
  // 공백·슬래시 제거해서 재시도
  const keys = Object.keys(row);
  for (const c of candidates) {
    const norm = c.replace(/[\s/]/g, "").toLowerCase();
    const found = keys.find((k) => k.replace(/[\s/]/g, "").toLowerCase() === norm);
    if (found && row[found] !== undefined) return row[found];
  }
  return undefined;
}

function parseRow(row: Row, index: number): ParsedEmployee {
  const name = (col(row, "성명", "이름") ?? "").toString().trim();
  if (!name) {
    return {
      ok: false,
      error: `${index + 2}행: 이름이 비어 있음`,
      data: null as never,
    };
  }
  const statusRaw = (col(row, "재직상태", "상태", "현황") ?? "").toString().trim();
  const status: EmployeeStatus = STATUS_MAP[statusRaw] ?? "active";
  const isLeave = status === "on_leave";
  const leaveReasonRaw = (col(row, "휴직사유") ?? "").toString().trim();
  const leaveReason: LeaveReason | null = isLeave
    ? LEAVE_REASON_LABEL_TO_VALUE[leaveReasonRaw] ?? null
    : null;
  return {
    ok: true,
    data: {
      employee_number: cleanString(col(row, "직원번호", "사번")),
      name,
      headquarters: cleanString(col(row, "본부")),
      email: cleanString(col(row, "사내메일", "이메일", "이메일계정")),
      personal_email: cleanString(col(row, "외부메일")),
      phone: cleanString(col(row, "휴대전화", "연락처")),
      department: cleanString(col(row, "소속", "부서", "실")),
      part: cleanString(col(row, "파트")),
      position: cleanString(col(row, "직책", "직급", "직위")),
      work_location: cleanString(col(row, "근무지", "팀")),
      hire_date: normalizeDate(col(row, "입사확정일자", "입사 확정일자", "입사일", "정식일자")),
      first_work_date: normalizeDate(col(row, "출근일")),
      resignation_date: normalizeDate(col(row, "퇴사일", "실제퇴사일")),
      last_work_date: normalizeDate(col(row, "마지막근무일", "마지막 근무일")),
      status,
      leave_start_date: normalizeDate(col(row, "휴직일자", "휴직시작일")),
      leave_end_date: normalizeDate(col(row, "휴직종료예정일", "휴직종료 예정일", "휴직종료일")),
      leave_reason: leaveReason,
      return_from_leave_date: normalizeDate(col(row, "복직일자")),
      badge_card_returned: cleanString(col(row, "사원증법인카드반납", "사원증/법인카드 반납여부", "사원증/법인카드반납")),
      leave_reason_detail:
        isLeave && leaveReason === "other" ? cleanString(col(row, "휴직사유상세")) : null,
      notes: cleanString(col(row, "비고", "메모")),
    },
  };
}

export default function ImportPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ParsedEmployee[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [sheetInfo, setSheetInfo] = useState<string[]>([]);
  const [seedOnboarding, setSeedOnboarding] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  async function handleFile(file: File) {
    setResultMsg(null);
    setFileName(file.name);

    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });

    const KNOWN = ["성명", "이름", "직원번호", "사번", "본부", "소속", "부서", "실", "팀", "입사확정일자", "입사일", "정식일자", "재직상태", "상태", "현황", "휴대전화", "연락처", "사내메일", "이메일", "이메일계정", "직책", "직급", "직위", "실제퇴사일", "채용형태"];

    // 모든 시트 읽기
    const allParsed: ParsedEmployee[] = [];
    const allDetectedHeaders: string[] = [];
    const sheetSummary: string[] = [];

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      // 제목 행 건너뛰기: 첫 10행 중 실제 컬럼 헤더가 있는 행을 찾음
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const cells = (rawRows[i] as unknown[]) ?? [];
        const matches = cells.filter((c) =>
          KNOWN.some((k) => k === String(c ?? "").trim() || k.replace(/\s/g, "") === String(c ?? "").trim().replace(/\s/g, "")),
        );
        if (matches.length >= 3) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        sheetSummary.push(`${sheetName}: 헤더 미발견 (건너뜀)`);
        continue;
      }

      const json = XLSX.utils.sheet_to_json<Row>(sheet, {
        defval: "",
        range: headerRowIndex,
      });

      // 첫 시트의 헤더만 표시
      if (allDetectedHeaders.length === 0) {
        const detectedRow = (rawRows[headerRowIndex] as unknown[]) ?? [];
        allDetectedHeaders.push(
          ...detectedRow.map((h) => (h === undefined || h === null ? "" : String(h))),
        );
      }

      const parsed = json.map((r, i) => parseRow(r, i));
      const validCount = parsed.filter((p) => p.ok).length;
      sheetSummary.push(`${sheetName}: ${validCount}명`);
      allParsed.push(...parsed);
    }

    setDetectedHeaders(allDetectedHeaders);

    // 중복 검사: 기존 직원의 사번/이름과 대조
    const { data: existing } = await supabase
      .from("employees")
      .select("id, name, employee_number");
    const byNumber = new Map<string, string>();
    const byName = new Map<string, string>();
    (existing ?? []).forEach((e) => {
      const num = (e.employee_number ?? "").trim().toLowerCase();
      const nm = (e.name ?? "").trim().toLowerCase();
      if (num) byNumber.set(num, e.id);
      if (nm) byName.set(nm, e.id);
    });

    const seenNumbers = new Set<string>();
    const seenNames = new Set<string>();
    const marked = allParsed.map((p) => {
      if (!p.ok) return p;
      const num = (p.data.employee_number ?? "").trim().toLowerCase();
      const nm = p.data.name.trim().toLowerCase();
      let dup = false;
      let existingId: string | undefined;
      if (num) {
        if (byNumber.has(num)) {
          dup = true;
          existingId = byNumber.get(num);
        } else if (seenNumbers.has(num)) {
          dup = true;
        }
        seenNumbers.add(num);
      }
      if (!dup && nm) {
        if (byName.has(nm)) {
          dup = true;
          existingId = byName.get(nm);
        } else if (seenNames.has(nm)) {
          dup = true;
        }
        seenNames.add(nm);
      }
      return { ...p, duplicate: dup, existingId };
    });

    setRows(marked);
    setSheetInfo(sheetSummary);
  }

  function downloadTemplate() {
    const headers = [
      "입력일",
      "직원번호",
      "성명",
      "본부",
      "소속",
      "직책",
      "근무지",
      "재직상태",
      "입사확정일자",
      "출근일",
      "퇴사일",
      "마지막근무일",
      "휴직일자",
      "휴직종료예정일",
      "복직일자",
      "휴대전화",
      "사내메일",
      "외부메일",
      "비고",
      "사원증법인카드반납",
    ];
    const sample = [
      "",
      "11605",
      "홍길동",
      "Animation Studios",
      "Modeling팀 1파트",
      "팀원",
      "",
      "재직",
      "2025-01-15",
      "2025-01-20",
      "",
      "",
      "",
      "",
      "",
      "010-1234-5678",
      "hong@locus.com",
      "hong@naver.com",
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
    const newRows = rows.filter((r) => r.ok && !r.duplicate);
    const dupRows = rows.filter((r) => r.ok && r.duplicate && r.existingId);
    const dupNoId = rows.filter((r) => r.ok && r.duplicate && !r.existingId);

    if (newRows.length === 0 && (!updateExisting || dupRows.length === 0)) {
      setResultMsg("처리할 직원이 없습니다 (모두 중복 또는 오류).");
      return;
    }
    setImporting(true);
    setResultMsg(null);

    let insertedCount = 0;
    let updatedCount = 0;
    const failures: string[] = [];

    // 1) 신규 직원 일괄 insert
    if (newRows.length > 0) {
      const { data: inserted, error } = await supabase
        .from("employees")
        .insert(newRows.map((r) => r.data))
        .select("id");
      if (error || !inserted) {
        setImporting(false);
        setResultMsg(`신규 등록 오류: ${error?.message ?? "알 수 없는 오류"}`);
        return;
      }
      insertedCount = inserted.length;

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
    }

    // 2) 기존 직원 업데이트
    if (updateExisting && dupRows.length > 0) {
      for (const r of dupRows) {
        if (!r.existingId) continue;
        const patch: Record<string, unknown> = {};
        const d = r.data;
        if (d.employee_number) patch.employee_number = d.employee_number;
        if (d.headquarters) patch.headquarters = d.headquarters;
        if (d.email) patch.email = d.email;
        if (d.personal_email) patch.personal_email = d.personal_email;
        if (d.phone) patch.phone = d.phone;
        if (d.department) patch.department = d.department;
        if (d.part) patch.part = d.part;
        if (d.position) patch.position = d.position;
        if (d.work_location) patch.work_location = d.work_location;
        if (d.hire_date) patch.hire_date = d.hire_date;
        if (d.first_work_date) patch.first_work_date = d.first_work_date;
        if (d.resignation_date) patch.resignation_date = d.resignation_date;
        if (d.last_work_date) patch.last_work_date = d.last_work_date;
        if (d.status) patch.status = d.status;
        if (d.leave_start_date) patch.leave_start_date = d.leave_start_date;
        if (d.leave_end_date) patch.leave_end_date = d.leave_end_date;
        if (d.return_from_leave_date) patch.return_from_leave_date = d.return_from_leave_date;
        if (d.leave_reason) patch.leave_reason = d.leave_reason;
        if (d.leave_reason_detail) patch.leave_reason_detail = d.leave_reason_detail;
        if (d.badge_card_returned) patch.badge_card_returned = d.badge_card_returned;
        if (d.notes) patch.notes = d.notes;
        if (Object.keys(patch).length === 0) {
          failures.push(`${d.name}: 업데이트할 값 없음 (모든 칸 비어있음)`);
          continue;
        }
        console.log(`[Import] Updating ${d.name} (id=${r.existingId}):`, patch);
        const { error: upErr, data: upData } = await supabase
          .from("employees")
          .update(patch)
          .eq("id", r.existingId)
          .select("id, part");
        if (upErr) {
          failures.push(`${d.name}: ${upErr.message}`);
        } else if (!upData || upData.length === 0) {
          failures.push(`${d.name}: 업데이트는 성공했지만 행 0개 반영됨 (권한 또는 id 불일치)`);
        } else {
          updatedCount++;
          console.log(`[Import] Updated ${d.name}, part now =`, upData[0]?.part);
        }
      }
    }

    setImporting(false);
    const parts: string[] = [];
    parts.push(`신규 ${insertedCount}명`);
    if (updateExisting) parts.push(`업데이트 성공 ${updatedCount}명`);
    if (dupNoId.length > 0)
      parts.push(`매칭 실패 ${dupNoId.length}명 (existingId 없음)`);
    if (failures.length > 0) parts.push(`실패 ${failures.length}건`);
    let msg = `처리 완료 — ${parts.join(", ")}`;
    if (failures.length > 0) {
      msg += `\n실패 상세 (처음 5건):\n${failures.slice(0, 5).join("\n")}`;
    }
    msg += `\n\n결과 확인 후 직원 목록으로 이동하세요.`;
    setResultMsg(msg);
  }

  const newCount = rows.filter((r) => r.ok && !r.duplicate).length;
  const dupCount = rows.filter((r) => r.ok && r.duplicate).length;
  const errCount = rows.filter((r) => !r.ok).length;

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
            <br />
            <strong>중복 검사</strong>: 기존 직원과 <code>사번</code>이 같거나(있는 경우) <code>이름</code>이 같으면 자동으로 건너뜁니다.
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

        {sheetInfo.length > 0 && (
          <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
            <div className="text-blue-800 font-medium mb-1">읽은 시트 ({sheetInfo.length}개):</div>
            <div className="flex flex-wrap gap-2">
              {sheetInfo.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">{s}</span>
              ))}
            </div>
          </div>
        )}

        {detectedHeaders.length > 0 && (
          <div className="text-xs bg-gray-50 border border-gray-200 rounded p-2">
            <div className="text-gray-600 mb-1">감지된 컬럼 헤더:</div>
            <div className="flex flex-wrap gap-1">
              {detectedHeaders.map((h, i) => {
                const knownSet = new Set([
                  "입력일", "직원번호", "사번", "성명", "이름", "본부",
                  "소속", "부서", "파트", "직책", "직급", "근무지",
                  "재직상태", "상태", "입사확정일자", "입사 확정일자", "입사일",
                  "출근일", "퇴사일", "마지막근무일", "마지막 근무일",
                  "휴직일자", "휴직시작일", "휴직종료예정일", "휴직종료 예정일",
                  "휴직종료일", "복직일자", "휴대전화", "연락처",
                  "사내메일", "이메일", "외부메일", "비고", "메모",
                  "사원증법인카드반납", "사원증/법인카드 반납여부", "사원증/법인카드반납",
                  "휴직사유", "휴직사유상세",
                ]);
                const known = knownSet.has(h) ||
                  [...knownSet].some((k) => k.replace(/[\s/]/g, "").toLowerCase() === h.replace(/[\s/]/g, "").toLowerCase());
                return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded ${
                      known ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                    }`}
                    title={known ? "인식됨" : "인식되지 않음 — 정확한 이름 확인 필요"}
                  >
                    {h || "(빈 헤더)"}
                  </span>
                );
              })}
            </div>
            {!detectedHeaders.includes("파트") && (
              <div className="mt-2 text-amber-700">
                ⚠ 파트 컬럼이 인식되지 않았습니다. 헤더 이름이 정확히 <code>파트</code>인지(앞뒤 공백 X), 또는 별도 컬럼인지 확인해 주세요.
              </div>
            )}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="!w-auto"
            checked={seedOnboarding}
            onChange={(e) => setSeedOnboarding(e.target.checked)}
          />
          등록된 각 직원에 입사 체크리스트 기본 항목 자동 추가
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="!w-auto"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
          />
          기존 직원 정보도 업데이트 (사번 또는 이름이 일치하는 경우, 비어 있지 않은 값만 덮어씀)
        </label>
      </section>

      {rows.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm">
              총 {rows.length}행 · <span className="text-green-700">신규 {newCount}</span>
              {dupCount > 0 && (
                <span className={updateExisting ? "text-blue-700" : "text-gray-500"}>
                  {" · "}
                  {updateExisting ? `업데이트 ${dupCount}` : `중복 ${dupCount} (건너뜀)`}
                </span>
              )}
              {errCount > 0 && (
                <span className="text-red-700"> · 오류 {errCount}</span>
              )}
            </div>
            <button
              type="button"
              disabled={importing || (newCount === 0 && (!updateExisting || dupCount === 0))}
              onClick={doImport}
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-60"
            >
              {importing
                ? "처리 중..."
                : updateExisting && dupCount > 0
                  ? `신규 ${newCount}명 + 업데이트 ${dupCount}명`
                  : `신규 ${newCount}명 등록`}
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
                  <th className="text-left px-3 py-2">파트</th>
                  <th className="text-left px-3 py-2">직급</th>
                  <th className="text-left px-3 py-2">이메일</th>
                  <th className="text-left px-3 py-2">연락처</th>
                  <th className="text-left px-3 py-2">입사일</th>
                  <th className="text-left px-3 py-2">재직상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t border-gray-100 ${
                      !r.ok
                        ? "bg-red-50"
                        : r.duplicate
                          ? updateExisting
                            ? "bg-blue-50"
                            : "bg-gray-50 text-gray-400"
                          : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-gray-500">{i + 2}</td>
                    <td className="px-3 py-2">
                      {!r.ok ? (
                        <span className="text-red-700 text-xs" title={r.error}>
                          오류
                        </span>
                      ) : r.duplicate ? (
                        updateExisting ? (
                          <span className="text-blue-700 text-xs" title="기존 직원 — 비어있지 않은 값만 업데이트됨">
                            업데이트
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs" title="이미 등록된 직원 (사번 또는 이름 일치)">
                            중복
                          </span>
                        )
                      ) : (
                        <span className="text-green-700 text-xs">신규</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{r.data?.name ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.employee_number ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.department ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.part ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.position ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.email ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{r.data?.phone ?? "-"}</td>
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
        <div className="text-sm bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md whitespace-pre-wrap">
          {resultMsg}
          <div className="mt-3">
            <a
              href="/employees"
              className="inline-block bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
            >
              직원 목록으로 이동
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
