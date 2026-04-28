import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("../lib/supabase/client", () => ({
  createClient: () => createClientMock(),
}));

import { apiPost } from "../lib/api";

function buildSupabaseMock({
  selectResults = [],
  updateResults = [],
}: {
  selectResults?: Array<{ data: any; error: any }>;
  updateResults?: Array<{ data: any; error: any }>;
}) {
  let selectIndex = 0;
  let updateIndex = 0;

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => selectResults[selectIndex++] || { data: null, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => {
          const result = updateResults[updateIndex++] || { data: null, error: null };
          return {
            error: result.error,
            data: result.data,
            select: vi.fn(() => ({
              single: vi.fn(async () => result),
            })),
          };
        }),
      })),
    })),
  };
}

describe("apiPost sales/receipts/:id/reprint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("increments reprint count when tracking columns exist", async () => {
    createClientMock.mockReturnValue(
      buildSupabaseMock({
        selectResults: [
          { data: { id: 5 }, error: null },
          { data: { id: 5, reprint_count: 1 }, error: null },
        ],
        updateResults: [
          {
            data: {
              reprint_count: 2,
              last_reprinted_at: "2026-04-27T00:00:00.000Z",
            },
            error: null,
          },
        ],
      }),
    );

    const res = await apiPost("sales/receipts/5/reprint/", {});

    expect(res.data.message).toBe("Receipt reprinted successfully");
    expect(res.data.reprint_count).toBe(2);
    expect(res.data.last_reprinted_at).toBeTruthy();
  });

  it("gracefully succeeds when reprint_count column is missing", async () => {
    createClientMock.mockReturnValue(
      buildSupabaseMock({
        selectResults: [
          { data: { id: 9 }, error: null },
          {
            data: null,
            error: {
              code: "42703",
              message: "column receipts.reprint_count does not exist",
            },
          },
        ],
        updateResults: [{ data: null, error: null }],
      }),
    );

    const res = await apiPost("sales/receipts/9/reprint/", {});

    expect(res.data.message).toBe("Receipt reprinted successfully");
    expect(res.data.reprint_count).toBeNull();
  });

  it("throws 404 when receipt does not exist", async () => {
    createClientMock.mockReturnValue(
      buildSupabaseMock({
        selectResults: [
          {
            data: null,
            error: { message: "No rows", code: "PGRST116" },
          },
        ],
      }),
    );

    await expect(apiPost("sales/receipts/404/reprint/", {})).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
