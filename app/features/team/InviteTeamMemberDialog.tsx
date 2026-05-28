import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button, FormField, Input, Modal } from "@/components/ui";
import { useInviteTeamMember } from "@/features/team/api";
import { toast } from "sonner";

const inviteSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteTeamMemberDialog({
  open,
  onOpenChange,
}: InviteTeamMemberDialogProps) {
  const { t } = useTranslation();
  const inviteMutation = useInviteTeamMember();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { fullName: "", email: "" },
  });

  async function onSubmit(values: InviteFormValues) {
    try {
      await inviteMutation.mutateAsync(values);
      toast.success(t("invite-sent", { email: values.email }));
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      titleKey="invite-team-member"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="invite-team-member-form"
            loading={inviteMutation.isPending}
          >
            {t("send")}
          </Button>
        </>
      }
    >
      <form
        id="invite-team-member-form"
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <FormField
          labelKey="full-name"
          htmlFor="invite-fullName"
          errorKey={errors.fullName ? "error-validation" : undefined}
          required
        >
          <Input
            id="invite-fullName"
            autoComplete="name"
            disabled={inviteMutation.isPending}
            {...register("fullName")}
          />
        </FormField>

        <FormField
          labelKey="email"
          htmlFor="invite-email"
          errorKey={errors.email ? "error-validation" : undefined}
          required
        >
          <Input
            id="invite-email"
            type="email"
            autoComplete="email"
            disabled={inviteMutation.isPending}
            {...register("email")}
          />
        </FormField>
      </form>
    </Modal>
  );
}
