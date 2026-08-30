export interface CourierAssignmentActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialCourierAssignmentActionState: CourierAssignmentActionState =
  {
    status: "idle",
  };
