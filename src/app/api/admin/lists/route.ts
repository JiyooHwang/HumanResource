import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase };
  }
  return { ok: true as const, user, supabase };
}

function tableFor(type: string) {
  if (type === "headquarters") return "headquarters_list";
  if (type === "department") return "department_list";
  if (type === "part") return "part_list";
  return null;
}

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { supabase } = auth;
    const [hqRes, deptRes, partRes] = await Promise.all([
      supabase.from("headquarters_list").select("*").order("sort_order"),
      supabase.from("department_list").select("*").order("sort_order"),
      supabase.from("part_list").select("*").order("sort_order"),
    ]);
    if (hqRes.error) return NextResponse.json({ error: hqRes.error.message }, { status: 500 });
    if (deptRes.error) return NextResponse.json({ error: deptRes.error.message }, { status: 500 });

    return NextResponse.json({
      headquarters: hqRes.data,
      departments: deptRes.data,
      parts: partRes.data ?? [],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const type = String(body.type ?? "");
    const name = String(body.name ?? "").trim();
    const table = tableFor(type);
    if (!table) return NextResponse.json({ error: "type must be 'headquarters', 'department' or 'part'" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "이름을 입력하세요." }, { status: 400 });

    const { supabase } = auth;

    // Get the max sort_order
    const { data: maxRow } = await supabase
      .from(table)
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();
    const nextOrder = (maxRow?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from(table)
      .insert({ name, sort_order: nextOrder })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const type = String(body.type ?? "");
    const id = String(body.id ?? "");
    const table = tableFor(type);
    if (!table) return NextResponse.json({ error: "type must be 'headquarters', 'department' or 'part'" }, { status: 400 });
    if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

    const { supabase } = auth;
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "이름을 입력하세요." }, { status: 400 });
      patch.name = name;
    }
    if (body.sort_order !== undefined) {
      patch.sort_order = Number(body.sort_order);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "변경할 값이 없습니다." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "";
    const id = searchParams.get("id") ?? "";
    const table = tableFor(type);
    if (!table) return NextResponse.json({ error: "type must be 'headquarters', 'department' or 'part'" }, { status: 400 });
    if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

    const { supabase } = auth;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
