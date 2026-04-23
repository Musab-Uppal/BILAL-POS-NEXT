const dotenv = require("dotenv");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminIdentifier = process.env.USERNAME;
const adminPassword = process.env.PASSWORD;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY in .env",
  );
}

const service = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anon = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const requiredTables = [
  "client",
  "item",
  "order",
  "order_items",
  "receipts",
  "receipt_items",
];

function maskEmail(email) {
  if (!email) return "(not found)";
  const [local, domain] = email.split("@");
  if (!domain) return "(invalid)";
  const safeLocal =
    local.length <= 2 ? `${local[0] || "*"}*` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
}

async function checkTables() {
  const results = [];
  for (const table of requiredTables) {
    const { error } = await service
      .from(table)
      .select("*", { count: "exact", head: true });
    results.push({ table, ok: !error, error: error?.message || null });
  }
  return results;
}

async function checkRpcExists() {
  const { error } = await service.rpc("create_order_with_receipt", {
    p_customer: -999999,
    p_items: [{ product: "-1", quantity: "1.00", factor: "1.00" }],
    p_payment_amount: 0,
    p_payment_method: "cash",
    p_payment_status: "unpaid",
    p_total_amount: 10,
    p_balance_due: 10,
    p_date: new Date().toISOString().slice(0, 10),
  });

  if (!error) {
    return { ok: true, detail: "RPC executed" };
  }

  const existsHints = [
    "Customer not found",
    "Order must contain at least one item",
    "Product",
  ];

  const looksLikeFunctionExists = existsHints.some((h) =>
    String(error.message || "")
      .toLowerCase()
      .includes(h.toLowerCase()),
  );

  return {
    ok: looksLikeFunctionExists,
    detail: error.message,
  };
}

async function checkRlsBlocksAnonymous() {
  const { error } = await anon.from("client").select("id").limit(1);

  // With your RLS policy (authenticated only), anonymous query should fail.
  return {
    ok: !!error,
    detail: error ? error.message : "Anonymous query unexpectedly succeeded",
  };
}

async function resolveAdminEmail() {
  if (!adminIdentifier) return null;

  const normalized = adminIdentifier.trim().toLowerCase();
  if (normalized.includes("@")) return normalized;

  const { data, error } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) {
    throw new Error(`Unable to list auth users: ${error.message}`);
  }

  const users = data?.users || [];
  const matched = users.find((u) => {
    const email = String(u.email || "").toLowerCase();
    const local = email.includes("@") ? email.split("@")[0] : email;
    const username = String(u.user_metadata?.username || "").toLowerCase();
    return (
      email === normalized || local === normalized || username === normalized
    );
  });

  if (matched?.email) {
    return matched.email;
  }

  // Deterministic fallback used by login flow and bootstrap script.
  return `${normalized}@pos.local`;
}

async function checkAdminCredentials() {
  if (!adminIdentifier || !adminPassword) {
    return {
      ok: false,
      detail: "USERNAME or PASSWORD missing in .env",
      adminEmail: null,
    };
  }

  const adminEmail = await resolveAdminEmail();
  if (!adminEmail) {
    return {
      ok: false,
      detail: "Could not map USERNAME to a Supabase auth user",
      adminEmail: null,
    };
  }

  const { error } = await anon.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  // Clean up test session if login succeeded.
  if (!error) {
    await anon.auth.signOut();
  }

  return {
    ok: !error,
    detail: error ? error.message : "Admin credentials login is valid",
    adminEmail,
  };
}

async function main() {
  console.log("Checking Supabase connectivity and POS requirements...\n");

  const [tables, rpc, rls, admin] = await Promise.all([
    checkTables(),
    checkRpcExists(),
    checkRlsBlocksAnonymous(),
    checkAdminCredentials(),
  ]);

  console.log("Tables:");
  for (const t of tables) {
    console.log(`- ${t.table}: ${t.ok ? "OK" : `FAIL (${t.error})`}`);
  }

  console.log(
    `\nRPC create_order_with_receipt: ${rpc.ok ? "OK" : `FAIL (${rpc.detail})`}`,
  );
  console.log(`RLS anonymous block: ${rls.ok ? "OK" : `FAIL (${rls.detail})`}`);
  console.log(
    `Admin credential check: ${admin.ok ? "OK" : `FAIL (${admin.detail})`} (${maskEmail(admin.adminEmail)})`,
  );

  const allTablesOk = tables.every((t) => t.ok);
  const allGood = allTablesOk && rpc.ok && rls.ok && admin.ok;

  if (!allGood) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Health check failed:", err.message);
  process.exit(1);
});
