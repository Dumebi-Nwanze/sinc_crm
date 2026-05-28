import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { z } from "zod";
import { Button, FormField, Input } from "@/components/ui";
import { fetchMe } from "@/features/auth/api";
import { claimAccount } from "@/features/auth/onboardingApi";
import { getPostLoginPath, sanitizeRedirectPath } from "@/lib/authRedirects";
import { supabase } from "@/lib/supabaseClient";

const acceptInviteSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "password-mismatch",
    path: ["confirmPassword"],
  });

type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;

export function AcceptInviteForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: AcceptInviteFormValues) {
    setSubmitError(null);

    const token = searchParams.get("token");
    if (!token) {
      setSubmitError("accept-invite-error");
      return;
    }

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "invite",
      });

      if (verifyError) {
        setSubmitError("accept-invite-error");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (updateError) {
        setSubmitError("error-generic");
        return;
      }

      try {
        await claimAccount();
      } catch {
        // Sales reps have no client row to claim — ignore claim errors.
      }

      const profile = await fetchMe();
      const redirect = sanitizeRedirectPath(searchParams.get("redirect"));
      navigate(redirect ?? getPostLoginPath(profile.role), { replace: true });
    } catch {
      setSubmitError("error-generic");
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField
        labelKey="password"
        htmlFor="password"
        errorKey={
          errors.password
            ? errors.password.type === "too_small"
              ? "password-min-length"
              : "error-validation"
            : undefined
        }
        required
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          {...register("password")}
        />
      </FormField>

      <FormField
        labelKey="confirm-password"
        htmlFor="confirmPassword"
        errorKey={
          errors.confirmPassword
            ? errors.confirmPassword.message === "password-mismatch"
              ? "password-mismatch"
              : "error-validation"
            : undefined
        }
        required
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          {...register("confirmPassword")}
        />
      </FormField>

      {submitError && (
        <p className="text-[12px] text-[var(--color-error)]">{t(submitError)}</p>
      )}

      <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
        {t("accept-invite-submit")}
      </Button>
    </form>
  );
}
