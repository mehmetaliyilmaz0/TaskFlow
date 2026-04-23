import { redirect } from "next/navigation";
import { AuthForm, type AuthFormState } from "@/components/auth/auth-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/boards");
  }

  async function registerAction(
    _previousState: AuthFormState,
    formData: FormData
  ): Promise<AuthFormState> {
    "use server";

    const supabase = await createSupabaseServerClient();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!email || !password) {
      return {
        error: "Email and password are required.",
        success: null,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: appUrl
        ? {
            emailRedirectTo: `${appUrl}/login`,
          }
        : undefined,
    });

    if (error) {
      return {
        error: error.message,
        success: null,
      };
    }

    if (data.session) {
      redirect("/boards");
    }

    return {
      error: null,
      success:
        "Account created. If email confirmation is enabled, check your inbox before signing in.",
    };
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
      <AuthForm mode="register" action={registerAction} />
    </main>
  );
}
