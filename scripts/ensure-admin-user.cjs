const dotenv = require("dotenv");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminIdentifier = process.env.USERNAME;
const adminPassword = process.env.PASSWORD;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env",
  );
}

if (!adminIdentifier || !adminPassword) {
  throw new Error("Missing USERNAME or PASSWORD in .env");
}

const service = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function resolveAdminEmail(identifier) {
  const normalized = String(identifier || "").trim().toLowerCase();
  if (!normalized) {
    throw new Error("USERNAME cannot be empty");
  }
  if (normalized.includes("@")) {
    return normalized;
  }
  return `${normalized}@pos.local`;
}

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Unable to list users: ${error.message}`);
    }

    const batch = data?.users || [];
    users.push(...batch);

    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

function userMatchesAdmin(user, username, adminEmail) {
  const normalizedUsername = username.trim().toLowerCase();
  const email = String(user.email || "").toLowerCase();
  const localPart = email.includes("@") ? email.split("@")[0] : email;
  const metadataUsername = String(user.user_metadata?.username || "").toLowerCase();

  return (
    email === adminEmail ||
    localPart === normalizedUsername ||
    metadataUsername === normalizedUsername
  );
}

async function upsertAdminUser() {
  const adminEmail = resolveAdminEmail(adminIdentifier);
  const users = await listAllUsers();
  const existing = users.find((u) =>
    userMatchesAdmin(u, adminIdentifier, adminEmail),
  );

  if (existing) {
    const { error } = await service.auth.admin.updateUserById(existing.id, {
      email: adminEmail,
      password: adminPassword,
      user_metadata: {
        ...(existing.user_metadata || {}),
        username: String(adminIdentifier || "").trim().toLowerCase(),
        role: "admin",
      },
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Failed to update admin user: ${error.message}`);
    }

    console.log(`Admin user updated: ${adminEmail}`);
    return;
  }

  const { error } = await service.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      username: String(adminIdentifier || "").trim().toLowerCase(),
      role: "admin",
    },
  });

  if (error) {
    throw new Error(`Failed to create admin user: ${error.message}`);
  }

  console.log(`Admin user created: ${adminEmail}`);
}

upsertAdminUser().catch((err) => {
  console.error("ensure_admin_failed:", err.message);
  process.exit(1);
});
