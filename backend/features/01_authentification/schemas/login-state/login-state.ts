export type LoginState = {
  ok: boolean;
  message: string | null;
  fieldErrors: {
    email?: string;
    password?: string;
  };
};

export const initialLoginState: LoginState = {
  ok: false,
  message: null,
  fieldErrors: {},
};
