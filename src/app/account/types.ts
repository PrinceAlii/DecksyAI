export type UpdateProfileState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type ExportAccountState = {
  status: "idle" | "success" | "error";
  message?: string;
  downloadPath?: string;
  checksum?: string;
};

export type DeleteAccountState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const updateProfileInitialState: UpdateProfileState = { status: "idle" };
export const exportAccountInitialState: ExportAccountState = { status: "idle" };
export const deleteAccountInitialState: DeleteAccountState = { status: "idle" };
export const revokeSessionsInitialState: UpdateProfileState = { status: "idle" };
