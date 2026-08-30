export interface OrderActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialOrderActionState: OrderActionState = {
  status: "idle",
};
