import { redirect } from "next/navigation";
import { BoardList } from "@/components/boards/board-list";
import { createBoardAction } from "@/features/boards/actions";
import { listBoardsForUser } from "@/features/boards/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function BoardsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const boards = await listBoardsForUser(user.id);

  async function createBoardFormAction(
    previousState: Parameters<typeof createBoardAction>[0],
    formData: Parameters<typeof createBoardAction>[1]
  ) {
    "use server";

    return createBoardAction(previousState, formData);
  }

  async function logoutAction() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="w-full space-y-8">
        <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Protected App Route
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Board CRUD is now the active scope.
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Signed in as <strong>{user.email}</strong>. This screen now loads
                your boards from Postgres through the authenticated session and
                keeps product scope limited to board creation and navigation.
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Log out
              </button>
            </form>
          </div>
        </section>

        <BoardList boards={boards} createBoardAction={createBoardFormAction} />
      </div>
    </main>
  );
}
