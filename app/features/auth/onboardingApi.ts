import type { UserProfile } from "@/features/auth/types";
import { apiFetch } from "@/lib/apiClient";

export interface InquiryInput {
  fullName: string;
  email: string;
  message: string;
}

export interface InquiryResponse {
  threadId: string;
}

export class InquiryConflictError extends Error {
  constructor() {
    super("error-inquiry-email-exists");
    this.name = "InquiryConflictError";
  }
}

export async function submitInquiry(
  input: InquiryInput,
): Promise<InquiryResponse> {
  try {
    return await apiFetch<InquiryResponse>("/api/inquiry", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "error-inquiry-email-exists") {
      throw new InquiryConflictError();
    }
    throw err;
  }
}

export async function claimAccount(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/me/claim", {
    method: "POST",
  });
}
