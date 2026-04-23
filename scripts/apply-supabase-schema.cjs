const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { Client } = require("pg");

const frontendDir = process.cwd();
const rootDir = path.resolve(frontendDir, "..");

dotenv.config({ path: path.join(frontendDir, ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const databasePassword = process.env.DATABASE_PASSWORD;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing in frontend/.env");
}

if (!databasePassword) {
  throw new Error("DATABASE_PASSWORD is missing in frontend/.env");
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const schemaPath = path.join(rootDir, "supabase", "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf8");

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: "postgres",
  password: databasePassword,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();

  try {
    await client.query(schemaSql);

    const tableCheck = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('client', 'item', 'order', 'order_items', 'receipts', 'receipt_items')
      order by table_name;
    `);

    const fnCheck = await client.query(`
      select routine_name
      from information_schema.routines
      where specific_schema = 'public'
        and routine_name = 'create_order_with_receipt';
    `);

    console.log("tables:", tableCheck.rows.map((r) => r.table_name).join(", "));
    console.log("rpc_exists:", fnCheck.rowCount === 1);

    await client.query("begin");

    const c = await client.query(
      "insert into client(name, balance) values ('snapshot-test-client', 100.00) returning id;",
    );
    const i = await client.query(
      "insert into item(name, price) values ('snapshot-test-item', 10.00) returning id;",
    );

    const rpc = await client.query(
      `select create_order_with_receipt(
        $1::bigint,
        $2::jsonb,
        $3::numeric,
        $4::varchar,
        $5::varchar,
        $6::numeric,
        $7::numeric,
        $8::date
      ) as payload;`,
      [
        c.rows[0].id,
        JSON.stringify([
          {
            product: String(i.rows[0].id),
            quantity: "2.00",
            factor: "1.00",
          },
        ]),
        5.0,
        "cash",
        "partial",
        20.0,
        15.0,
        new Date().toISOString().slice(0, 10),
      ],
    );

    const receiptId = rpc.rows[0].payload.receipt_id;
    const receipt = await client.query(
      "select previous_balance, current_bill_amount, payment_made, updated_balance from receipts where id = $1;",
      [receiptId],
    );

    console.log("snapshot_test_receipt:", receipt.rows[0]);

    await client.query("rollback");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("migration_failed:", err.message);
  process.exit(1);
});
