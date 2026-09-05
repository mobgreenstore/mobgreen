export interface VerificationActionState {
  status: "idle" | "success" | "error";
  message?: string;
  codes?: string[];
}

export const initialVerificationActionState: VerificationActionState = {
  status: "idle",
};
