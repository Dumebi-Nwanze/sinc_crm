import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button, FormField, Input } from "@/components/ui";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  submitError: string | null;
}

export function LoginForm({ onSubmit, submitError }: LoginFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
        labelKey="password"
        htmlFor="password"
        errorKey={errors.password ? "error-validation" : undefined}
        required
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          disabled={isSubmitting}
          {...register("password")}
        />
      </FormField>

      {submitError && (
        <p className="text-[12px] text-[var(--color-error)]">{t(submitError)}</p>
      )}

      <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  );
}
