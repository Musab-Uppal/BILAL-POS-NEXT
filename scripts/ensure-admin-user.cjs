const dotenv = require("dotenv");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env",
  );
}

const service = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function getAdminCredentials() {
  const raw = [
    {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    },
    {
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
    },
    {
      username: process.env.USER1NAME,
      password: process.env.USER1PASSWORD,
    },
    {
      username: process.env.USER2NAME,
      password: process.env.USER2PASSWORD,
    },
  ];

  const normalized = raw
    .map((pair) => ({
      username: String(pair.username || "")
        .trim()
        .toLowerCase(),
      password: String(pair.password || ""),
    }))
    .filter((pair) => pair.username && pair.password);

  const unique = [];
  const seen = new Set();
  for (const cred of normalized) {
    if (seen.has(cred.username)) continue;
    seen.add(cred.username);
    unique.push(cred);
  }

  return unique;
}

function resolveAdminEmail(identifier) {
  const normalized = String(identifier || "")
    .trim()
    .toLowerCase();
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
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage,
    });
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
  const metadataUsername = String(
    user.user_metadata?.username || "",
  ).toLowerCase();

  return (
    email === adminEmail ||
    localPart === normalizedUsername ||
    metadataUsername === normalizedUsername
  );
}

async function upsertAdminUser(cred) {
  const adminEmail = resolveAdminEmail(cred.username);
  const users = await listAllUsers();
  const existing = users.find((u) =>
    userMatchesAdmin(u, cred.username, adminEmail),
  );

  if (existing) {
    const { error } = await service.auth.admin.updateUserById(existing.id, {
      email: adminEmail,
      password: cred.password,
      user_metadata: {
        ...(existing.user_metadata || {}),
        username: cred.username,
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
    password: cred.password,
    email_confirm: true,
    user_metadata: {
      username: cred.username,
      role: "admin",
    },
  });

  if (error) {
    throw new Error(`Failed to create admin user: ${error.message}`);
  }

  console.log(`Admin user created: ${adminEmail}`);
}

async function run() {
  const creds = getAdminCredentials();
  if (creds.length === 0) {
    throw new Error(
      "No admin credentials found in .env (expected USER1NAME/USER1PASSWORD, USER2NAME/USER2PASSWORD, USERNAME/PASSWORD, or ADMIN_USERNAME/ADMIN_PASSWORD)",
    );
  }

  for (const cred of creds) {
    await upsertAdminUser(cred);
  }

  console.log(`Admin bootstrap completed for ${creds.length} account(s).`);
}

run().catch((err) => {
  console.error("ensure_admin_failed:", err.message);
  process.exit(1);
});
