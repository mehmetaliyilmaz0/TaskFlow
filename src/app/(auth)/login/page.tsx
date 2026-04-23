import { redirect } from "next/navigation";
import { AuthForm, type AuthFormState } from "@/components/auth/auth-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/boards");
  }

  async function loginAction(
    _previousState: AuthFormState,
    formData: FormData
  ): Promise<AuthFormState> {
    "use server";

    const supabase = await createSupabaseServerClient();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return {
        error: "Email and password are required.",
        success: null,
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: error.message,
        success: null,
      };
    }

    redirect("/boards");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
      <AuthForm mode="login" action={loginAction} />
    </main>
  );
}
