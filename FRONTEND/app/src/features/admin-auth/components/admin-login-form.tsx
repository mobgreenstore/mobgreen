"use client";

import { AtSign, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  FormField,
  IconButton,
  InlineAlert,
  Label,
  TextField,
} from "@/components/ui";
import type { SignInActionState } from "@/server/auth/action-state";
import { signInAction } from "@/server/auth/actions";

const initialState: SignInActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} className="mt-1" type="submit">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function AdminLoginForm({
  redirectTo = "/admin",
}: {
  redirectTo?: string;
}) {
  const [state, action] = useActionState(signInAction, initialState);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form
      action={action}
      className="mt-7 grid gap-5"
      aria-label="Admin sign-in"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {state.error && (
        <InlineAlert
          tone="danger"
          title="Sign-in failed"
          description={state.error}
        />
      )}
      <FormField id="admin-email">
        <Label required>Email address</Label>
        <TextField
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          maxLength={320}
          placeholder="admin@mobgreens.com"
          leading={<AtSign aria-hidden="true" className="size-4" />}
          required
        />
      </FormField>
      <FormField id="admin-password">
        <Label required>Password</Label>
        <TextField
          name="password"
          type={passwordVisible ? "text" : "password"}
          autoComplete="current-password"
          minLength={12}
          maxLength={128}
          placeholder="Enter your password"
          leading={<LockKeyhole aria-hidden="true" className="size-4" />}
          trailing={
            <IconButton
              type="button"
              size="small"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              aria-controls="admin-password"
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
              className="rounded-full"
            >
              {passwordVisible ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </IconButton>
          }
          required
        />
      </FormField>
      <SubmitButton />
    </form>
  );
}
