import TeamManager from "./TeamManager";

export const dynamic = "force-dynamic";

export default function TeamPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">팀원 관리</h1>
      <p className="text-sm text-gray-500">
        이 사이트에 접근할 수 있는 계정을 초대하거나 삭제합니다.
      </p>
      <TeamManager />
    </div>
  );
}
