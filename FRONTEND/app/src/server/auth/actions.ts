"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SignInActionState } from "@/server/auth/action-state";
import { AdminAuthenticationService } from "@/server/auth/authenticate";
import { getSafeAdminRedirect } from "@/server/auth/safe-redirect";
import { createAdminSession, destroyAdminSession } from "@/server/auth/session";

function getClientAddress(headerStore: Headers) {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

// Public by design: this is the credential-verification boundary.
export async function signInAction(
  _previousState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const result = await new AdminAuthenticationService().authenticate(
    {
      email: formData.get("email"),
      password: formData.get("password"),
    },
    getClientAddress(await headers()),
  );

  if (!result.ok) return { error: result.error.message };
  await createAdminSession(result.value.adminId, result.value.sessionVersion);
  redirect(getSafeAdminRedirect(formData.get("redirectTo")));
}

export async function signOutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
