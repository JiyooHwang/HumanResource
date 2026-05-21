import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const, user };
}

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      confirmed: !!u.email_confirmed_at,
      invited_at: u.invited_at,
    }));
    return NextResponse.json({ users });
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

  const body = await request.json();
  const email = String(body.email ?? "").trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "올바른 이메일을 입력하세요." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const origin = new URL(request.url).origin;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: origin,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });
  if (id === auth.user.id) {
    return NextResponse.json({ error: "자기 자신은 삭제할 수 없습니다." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
