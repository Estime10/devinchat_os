import { isLoginFormComplete } from "@/backend/authentification/schemas/login-form-complete";
import { isRegisterFormComplete } from "@/backend/authentification/schemas/register-form-complete";
import { describe, expect, it } from "vitest";

function formDataFrom(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe("isLoginFormComplete", () => {
  it("accepte un login valide", () => {
    expect(
      isLoginFormComplete(
        formDataFrom({
          email: "root@devinchat.os",
          password: "secret",
        }),
      ),
    ).toBe(true);
  });

  it("refuse email invalide ou password vide", () => {
    expect(
      isLoginFormComplete(
        formDataFrom({ email: "not-an-email", password: "secret" }),
      ),
    ).toBe(false);
    expect(
      isLoginFormComplete(
        formDataFrom({ email: "root@devinchat.os", password: "" }),
      ),
    ).toBe(false);
  });
});

describe("isRegisterFormComplete", () => {
  it("accepte un register valide", () => {
    expect(
      isRegisterFormComplete(
        formDataFrom({
          pseudo: "root",
          email: "root@devinchat.os",
          password: "password1",
          confirmPassword: "password1",
        }),
      ),
    ).toBe(true);
  });

  it("refuse pseudo court, password court ou mismatch", () => {
    expect(
      isRegisterFormComplete(
        formDataFrom({
          pseudo: "r",
          email: "root@devinchat.os",
          password: "password1",
          confirmPassword: "password1",
        }),
      ),
    ).toBe(false);
    expect(
      isRegisterFormComplete(
        formDataFrom({
          pseudo: "root",
          email: "root@devinchat.os",
          password: "short",
          confirmPassword: "short",
        }),
      ),
    ).toBe(false);
    expect(
      isRegisterFormComplete(
        formDataFrom({
          pseudo: "root",
          email: "root@devinchat.os",
          password: "password1",
          confirmPassword: "password2",
        }),
      ),
    ).toBe(false);
  });
});
