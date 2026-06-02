"use client";

import { useCallback, useEffect, useState } from "react";

type ListItem = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

type ListType = "headquarters" | "department" | "part";

export default function ListManager() {
  const [headquarters, setHeadquarters] = useState<ListItem[]>([]);
  const [departments, setDepartments] = useState<ListItem[]>([]);
  const [parts, setParts] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/lists");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setHeadquarters(data.headquarters ?? []);
      setDepartments(data.departments ?? []);
      setParts(data.parts ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  if (loading) {
    return <div className="text-sm text-gray-500">불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        오류: {error}
        <button
          onClick={() => { setLoading(true); fetchLists(); }}
          className="ml-2 text-blue-600 hover:underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ListSection
        title="본부 목록"
        type="headquarters"
        items={headquarters}
        onRefresh={fetchLists}
      />
      <ListSection
        title="소속 목록"
        type="department"
        items={departments}
        onRefresh={fetchLists}
      />
      <ListSection
        title="파트 목록"
        type="part"
        items={parts}
        onRefresh={fetchLists}
      />
    </div>
  );
}

function ListSection({
  title,
  type,
  items,
  onRefresh,
}: {
  title: string;
  type: ListType;
  items: ListItem[];
  onRefresh: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setNewName("");
      onRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(item: ListItem) {
    if (!confirm(`'${item.name}'을(를) 삭제할까요?`)) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/lists?type=${type}&id=${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");
      onRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleRename(item: ListItem, newName: string) {
    const name = newName.trim();
    if (!name || name === item.name) return;
    setActionError(null);
    try {
      const res = await fetch("/api/admin/lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: item.id, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "변경 실패");
      onRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleMove(item: ListItem, direction: "up" | "down") {
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const other = items[swapIdx];

    setActionError(null);
    try {
      // Swap sort_order values
      const res1 = await fetch("/api/admin/lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: item.id, sort_order: other.sort_order }),
      });
      const res2 = await fetch("/api/admin/lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: other.id, sort_order: item.sort_order }),
      });
      const d1 = await res1.json();
      const d2 = await res2.json();
      if (!res1.ok) throw new Error(d1.error ?? "이동 실패");
      if (!res2.ok) throw new Error(d2.error ?? "이동 실패");
      onRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">
        {title} <span className="text-sm text-gray-500 font-normal">{items.length}개</span>
      </h2>

      {actionError && (
        <div className="text-sm text-red-600 mb-2">오류: {actionError}</div>
      )}

      <ul className="divide-y divide-gray-100 mb-3 max-h-[60vh] overflow-y-auto">
        {items.map((item, idx) => (
          <ListItemRow
            key={item.id}
            item={item}
            isFirst={idx === 0}
            isLast={idx === items.length - 1}
            onRename={(name) => handleRename(item, name)}
            onDelete={() => handleDelete(item)}
            onMoveUp={() => handleMove(item, "up")}
            onMoveDown={() => handleMove(item, "down")}
          />
        ))}
        {items.length === 0 && (
          <li className="py-3 text-sm text-gray-500">항목이 없습니다.</li>
        )}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 항목 추가"
          className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-60 whitespace-nowrap"
        >
          {adding ? "추가 중..." : "추가"}
        </button>
      </form>
    </div>
  );
}

function ListItemRow({
  item,
  isFirst,
  isLast,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  item: ListItem;
  isFirst: boolean;
  isLast: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.name);

  function startEdit() {
    setEditValue(item.name);
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    if (editValue.trim() && editValue.trim() !== item.name) {
      onRename(editValue);
    }
  }

  return (
    <li className="py-2 flex items-center gap-2 group">
      <span className="text-xs text-gray-400 w-6 text-right shrink-0">
        {item.sort_order}
      </span>
      <div className="flex gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1"
          title="위로"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1"
          title="아래로"
        >
          ▼
        </button>
      </div>
      {editing ? (
        <input
          autoFocus
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="flex-1 text-sm border border-blue-400 rounded px-2 py-0.5"
        />
      ) : (
        <span
          className="flex-1 text-sm cursor-pointer hover:text-blue-600"
          onClick={startEdit}
          title="클릭하여 이름 변경"
        >
          {item.name}
        </span>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="text-gray-300 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        title="삭제"
      >
        ✕
      </button>
    </li>
  );
}
