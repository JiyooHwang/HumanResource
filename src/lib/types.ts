export type EmployeeStatus = "active" | "on_leave" | "resigned";
export type LeaveReason = "parental" | "maternity" | "unpaid" | "other";

export const LEAVE_REASON_LABEL: Record<LeaveReason, string> = {
  parental: "육아",
  maternity: "출산",
  unpaid: "무급",
  other: "기타",
};

export const LEAVE_REASON_LABEL_TO_VALUE: Record<string, LeaveReason> = {
  육아: "parental",
  parental: "parental",
  출산: "maternity",
  maternity: "maternity",
  무급: "unpaid",
  unpaid: "unpaid",
  기타: "other",
  other: "other",
};

export type Employee = {
  id: string;
  employee_number: string | null;
  name: string;
  headquarters: string | null;
  department: string | null;
  part: string | null;
  position: string | null;
  work_location: string | null;
  email: string | null;
  personal_email: string | null;
  phone: string | null;
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
  created_at: string;
  updated_at: string;
};

export type LeaveHistory = {
  id: string;
  employee_id: string;
  start_date: string | null;
  end_date: string | null;
  reason: LeaveReason | null;
  reason_detail: string | null;
  created_at: string;
};

export type ChecklistKind = "onboarding" | "offboarding";

export type ChecklistItem = {
  id: string;
  employee_id: string;
  kind: ChecklistKind;
  task: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  sort_order: number;
  created_at: string;
};

export const DEFAULT_ONBOARDING_TASKS = [
  "근로계약서 작성",
  "사번 발급",
  "이메일 계정 생성",
  "메신저/협업 툴 초대",
  "노트북 지급",
  "사원증/출입카드 발급",
  "4대보험 신고",
  "오리엔테이션 진행",
];

export const DEFAULT_OFFBOARDING_TASKS = [
  "퇴직서 수령",
  "인수인계 문서 확인",
  "노트북 회수",
  "사원증/출입카드 회수",
  "계정 비활성화 (이메일/메신저/협업 툴)",
  "4대보험 상실신고",
  "퇴직금 정산",
  "경력증명서 발급",
];

export const HEADQUARTERS_ORDER = [
  "주식회사 로커스",
  "Studio X",
  "VFX Studios",
  "Animation Studios",
  "실감영상기술연구소",
  "기업부설창작연구소",
  "AI 애니메이션연구소",
  "전략본부",
  "신규사업실",
];

// 부서 정렬 순서 (제작 과정 순). 목록에 없는 부서는 맨 뒤에 가나다순 배치.
export const DEPARTMENT_ORDER = [
  "부사장",
  "글로벌 사업 개발실",
  "IP사업실",
  "IP전략실",
  "Producer실",
  "Supervisor실",
  "Directing실",
  "StoryDevelopment",
  "VisualDevelopment",
  "Directing",
  "modeling",
  "Look Development",
  "CFX",
  "Animation",
  "Lighting",
  "FX",
  "Blender",
  "Composite",
  "Unreal",
  "제작기획팀",
  "Art팀",
  "3D팀",
  "Flame1팀",
  "Flame2팀",
  "Flame3팀",
  "Flame4팀",
  "AI팀",
  "DI팀",
  "파이프라인",
  "플랫폼",
  "AI 에이전트",
  "경영지원실",
  "HR팀",
  "GA팀",
  "EA팀",
  "투자전략실",
  "재무기획실",
  "기술연구팀",
  "기술보안팀",
  "CT기획팀",
];

export function headquartersSortKey(hq: string | null | undefined): string {
  if (!hq) return "￾";
  const norm = hq.replace(/\s+/g, "").toLowerCase();
  const idx = HEADQUARTERS_ORDER.findIndex(
    (h) => h.replace(/\s+/g, "").toLowerCase() === norm,
  );
  if (idx >= 0) return idx.toString().padStart(3, "0") + "_" + hq;
  return "999_" + hq;
}

export function departmentSortKey(dept: string | null | undefined): string {
  if (!dept) return "￾"; // 미배정 직원은 맨 마지막
  // 겸직은 슬래시(/)로 구분 — 첫 부서를 기준으로 정렬
  const primary = dept.split("/")[0];
  const norm = primary.replace(/\s+/g, "").toLowerCase();
  for (let i = 0; i < DEPARTMENT_ORDER.length; i++) {
    const key = DEPARTMENT_ORDER[i].replace(/\s+/g, "").toLowerCase();
    // "Animation팀" 같은 접미사 허용: 부서명이 키워드로 시작하면 매칭
    if (norm === key || norm.startsWith(key)) {
      return i.toString().padStart(3, "0") + "_" + dept;
    }
  }
  return "999_" + dept;
}

// 부서와 무관하게 최상단으로 끌어올릴 직급 (제외 시 99 반환)
export function positionTopPriority(position: string | null | undefined): number {
  if (!position) return 99;
  const norm = position.replace(/\s+/g, "").toLowerCase();
  // "사장"이 "부사장"에 포함되므로 정확히 구분
  if (/(?<!부)사장/.test(norm)) return 0; // 사장 (부사장 제외)
  if (norm.includes("부사장")) return 1;
  if (norm.includes("본부장")) return 2;
  if (norm.includes("cso")) return 3;
  return 99;
}
