import ListManager from "./ListManager";

export const dynamic = "force-dynamic";

export default function AdminListsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">본부/소속 관리</h1>
      <p className="text-sm text-gray-500">
        본부와 소속(부서) 목록을 추가, 수정, 삭제, 정렬할 수 있습니다.
        여기서 변경한 내용은 직원 등록/수정 시 선택 목록에 반영됩니다.
      </p>
      <ListManager />
    </div>
  );
}
