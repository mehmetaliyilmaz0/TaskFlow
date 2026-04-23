export type CreateBoardFormState = {
  error: string | null;
};

export type BoardMutationState = {
  error: string | null;
  successMessage: string | null;
  submittedAt: number;
};

export const initialBoardMutationState: BoardMutationState = {
  error: null,
  successMessage: null,
  submittedAt: 0,
};

export function createBoardMutationError(message: string): BoardMutationState {
  return {
    error: message,
    successMessage: null,
    submittedAt: Date.now(),
  };
}

export function createBoardMutationSuccess(message: string): BoardMutationState {
  return {
    error: null,
    successMessage: message,
    submittedAt: Date.now(),
  };
}
