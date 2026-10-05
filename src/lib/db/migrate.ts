import "dotenv/config";
import postgres from "postgres";

const sql = postgres(
  process.env.DATABASE_URL ||
    "postgres://opennow_user:opennow_secure_password@localhost:5432/opennow_db",
  { max: 1 }
);

async function main() {
  console.log("Running migrations...");
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

  await sql`
  CREATE TABLE IF NOT EXISTS sys_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    title VARCHAR(150),
    department VARCHAR(150),
    manager_id UUID REFERENCES sys_user(id) ON DELETE SET NULL,
    vip BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    sys_created_at TIMESTAMPTZ DEFAULT NOW(),
    sys_updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS sys_user_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES sys_user(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT TRUE
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS sys_user_grmember (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES sys_user(id) ON DELETE CASCADE,
    group_id UUID REFERENCES sys_user_group(id) ON DELETE CASCADE,
    UNIQUE(user_id, group_id)
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS sys_user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS sys_user_has_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES sys_user(id) ON DELETE CASCADE,
    role_id UUID REFERENCES sys_user_role(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id)
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(32) UNIQUE NOT NULL,
    sys_class_name VARCHAR(50) NOT NULL,
    short_description VARCHAR(255) NOT NULL,
    description TEXT,
    priority INT NOT NULL DEFAULT 4,
    urgency INT NOT NULL DEFAULT 3,
    impact INT NOT NULL DEFAULT 3,
    state INT NOT NULL DEFAULT 1,
    assigned_to UUID REFERENCES sys_user(id) ON DELETE SET NULL,
    assignment_group UUID REFERENCES sys_user_group(id) ON DELETE SET NULL,
    opened_by UUID NOT NULL REFERENCES sys_user(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_by UUID REFERENCES sys_user(id),
    closed_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    sys_created_at TIMESTAMPTZ DEFAULT NOW(),
    sys_updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS incident (
    task_id UUID PRIMARY KEY REFERENCES task(id) ON DELETE CASCADE,
    caller_id UUID NOT NULL REFERENCES sys_user(id),
    category VARCHAR(50) NOT NULL DEFAULT 'inquiry',
    subcategory VARCHAR(50),
    close_code VARCHAR(50),
    close_notes TEXT,
    hold_reason INT,
    parent_incident UUID REFERENCES task(id),
    cmdb_ci_id UUID
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS problem (
    task_id UUID PRIMARY KEY REFERENCES task(id) ON DELETE CASCADE,
    root_cause TEXT,
    workaround TEXT,
    known_error BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS change_request (
    task_id UUID PRIMARY KEY REFERENCES task(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL DEFAULT 'normal',
    risk INT NOT NULL DEFAULT 3,
    approval_state VARCHAR(30) DEFAULT 'not_requested',
    cab_required BOOLEAN DEFAULT FALSE,
    planned_start_date TIMESTAMPTZ,
    planned_end_date TIMESTAMPTZ,
    backout_plan TEXT,
    test_plan TEXT,
    implementation_plan TEXT
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS sys_journal_field (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    element VARCHAR(30) NOT NULL,
    value TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES sys_user(id),
    sys_created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_journal_task_element ON sys_journal_field(task_id, element)`;

  await sql`
  CREATE TABLE IF NOT EXISTS contract_sla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    target VARCHAR(30) NOT NULL,
    target_table VARCHAR(50) NOT NULL DEFAULT 'incident',
    duration_minutes INT NOT NULL,
    schedule VARCHAR(30) DEFAULT '24x7',
    start_condition JSONB NOT NULL,
    pause_condition JSONB,
    stop_condition JSONB NOT NULL,
    active BOOLEAN DEFAULT TRUE
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS task_sla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    sla_definition_id UUID NOT NULL REFERENCES contract_sla(id) ON DELETE CASCADE,
    stage VARCHAR(30) NOT NULL DEFAULT 'in_progress',
    start_time TIMESTAMPTZ NOT NULL,
    pause_time TIMESTAMPTZ,
    pause_duration_seconds INT DEFAULT 0,
    planned_end_time TIMESTAMPTZ NOT NULL,
    actual_end_time TIMESTAMPTZ,
    percentage_elapsed NUMERIC(5,2) DEFAULT 0.00,
    has_breached BOOLEAN DEFAULT FALSE
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_task_sla_monitoring ON task_sla(stage, planned_end_time) WHERE stage = 'in_progress'`;

  await sql`
  CREATE TABLE IF NOT EXISTS cmdb_ci (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sys_class_name VARCHAR(100) NOT NULL,
    operational_status VARCHAR(50) DEFAULT 'operational',
    ip_address INET,
    fqdn VARCHAR(255),
    owned_by UUID REFERENCES sys_user(id),
    sys_created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`
  CREATE TABLE IF NOT EXISTS cmdb_rel_ci (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES cmdb_ci(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES cmdb_ci(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL,
    UNIQUE(parent_id, child_id, relation_type)
  )`;

  console.log("Migrations complete.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
