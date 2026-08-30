export interface ProductActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialProductActionState: ProductActionState = {
  status: "idle",
};
