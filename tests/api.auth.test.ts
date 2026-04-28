import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const createClientMock = vi.fn();

vi.mock("../lib/supabase/client", () => ({
  createClient: () => createClientMock(),
}));

import { login } from "../lib/api";

describe("auth login behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockReturnValue({
      auth: {
        signInWithPassword,
      },
    });
  });

  it("normalizes username to email for Supabase", async () => {
    signInWithPassword.mockResolvedValueOnce({
      data: {
        session: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      },
      error: null,
    });

    await login("AdminUser", "secret");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "adminuser@pos.local",
      password: "secret",
    });
  });

  it("keeps full email unchanged", async () => {
    signInWithPassword.mockResolvedValueOnce({
      data: {
        session: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      },
      error: null,
    });

    await login("boss@example.com", "secret");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "boss@example.com",
      password: "secret",
    });
  });

  it("throws 401-shaped error when credentials are invalid", async () => {
    signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });

    await expect(login("user", "badpass")).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});
