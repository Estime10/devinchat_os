export type RegisterState = {
  ok: boolean;
  message: string | null;
  fieldErrors: {
    pseudo?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
};

export const initialRegisterState: RegisterState = {
  ok: false,
  message: null,
  fieldErrors: {},
};
