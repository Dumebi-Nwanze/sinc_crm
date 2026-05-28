import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { Button, FormField, Input, Textarea } from "@/components/ui";
import {
  InquiryConflictError,
  submitInquiry,
} from "@/features/auth/onboardingApi";

const inquirySchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

export function InquiryForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { fullName: "", email: "", message: "" },
  });

  async function onSubmit(values: InquiryFormValues) {
    setSubmitError(null);
    setHasExistingAccount(false);

    try {
      await submitInquiry(values);
      navigate("/inquiry-sent", { replace: true });
    } catch (err) {
      if (err instanceof InquiryConflictError) {
        setHasExistingAccount(true);
        return;
      }
      const key = err instanceof Error ? err.message : "error-generic";
      setSubmitError(key);
    }
  }

  return (
    <>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          labelKey="full-name"
          htmlFor="fullName"
          errorKey={errors.fullName ? "error-validation" : undefined}
          required
        >
          <Input
            id="fullName"
            autoComplete="name"
            disabled={isSubmitting}
            {...register("fullName")}
          />
        </FormField>

        <FormField
          labelKey="email"
          htmlFor="email"
          errorKey={errors.email ? "error-validation" : undefined}
          required
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            {...register("email")}
          />
        </FormField>

        <FormField
          labelKey="message"
          htmlFor="message"
          errorKey={errors.message ? "error-validation" : undefined}
          required
        >
          <Textarea id="message" rows={4} disabled={isSubmitting} {...register("message")} />
        </FormField>

        {hasExistingAccount && (
          <p className="text-[12px] text-[var(--color-error)]">
            {t("error-inquiry-email-exists")}{" "}
            <Link
              to="/login"
              className="font-medium underline hover:text-[var(--color-primary-800)]"
            >
              {t("inquiry-sign-in")}
            </Link>
          </p>
        )}

        {submitError && !hasExistingAccount && (
          <p className="text-[12px] text-[var(--color-error)]">{t(submitError)}</p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
          {t("inquiry-submit")}
        </Button>
      </form>

      <p className="mt-4 text-center text-[12px] text-[var(--color-gray-500)]">
        {t("inquiry-already-have-account")}{" "}
        <Link to="/login" className="font-medium text-[var(--color-primary-800)] underline">
          {t("inquiry-sign-in")}
        </Link>
      </p>
    </>
  );
}
