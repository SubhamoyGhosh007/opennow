import "dotenv/config";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  console.log("Seeding...");
  const hash = await bcrypt.hash("Password123!", 10);

  // Roles
  const roles = ["admin", "itil", "itil_admin", "approver_user", "employee"];
  for (const r of roles) {
    await sql`INSERT INTO sys_user_role (name) VALUES (${r}) ON CONFLICT DO NOTHING`;
  }

  // Users
  const users = [
    { user_name: "admin", email: "admin@opennow.local", first_name: "System", last_name: "Admin", title: "Administrator", department: "IT" },
    { user_name: "itil.fulfiller", email: "fulfiller@opennow.local", first_name: "ITIL", last_name: "Fulfiller", title: "Service Desk Agent", department: "IT" },
    { user_name: "network.tech", email: "network@opennow.local", first_name: "Network", last_name: "Tech", title: "Network Engineer", department: "Network" },
    { user_name: "abel.tuter", email: "abel.tuter@example.com", first_name: "Abel", last_name: "Tuter", title: "Employee", department: "Sales" },
    { user_name: "itil.manager", email: "manager@opennow.local", first_name: "ITIL", last_name: "Manager", title: "IT Manager", department: "IT" },
  ];
  const userIds: Record<string, string> = {};
  for (const u of users) {
    const rows = await sql`
      INSERT INTO sys_user (user_name, email, first_name, last_name, password_hash, title, department)
      VALUES (${u.user_name}, ${u.email}, ${u.first_name}, ${u.last_name}, ${hash}, ${u.title}, ${u.department})
      ON CONFLICT (user_name) DO UPDATE SET email = EXCLUDED.email RETURNING id`;
    userIds[u.user_name] = rows[0].id;
  }

  // Assign roles
  const roleMap: Record<string, string[]> = {
    admin: ["admin", "itil", "itil_admin", "approver_user", "employee"],
    "itil.manager": ["itil", "itil_admin", "approver_user"],
    "itil.fulfiller": ["itil"],
    "network.tech": ["itil"],
    "abel.tuter": ["employee"],
  };
  for (const [uname, rnames] of Object.entries(roleMap)) {
    for (const rn of rnames) {
      await sql`
        INSERT INTO sys_user_has_role (user_id, role_id)
        SELECT ${userIds[uname]}::uuid, id FROM sys_user_role WHERE name = ${rn}
        ON CONFLICT DO NOTHING`;
    }
  }

  // Groups
  const groups = ["Service Desk", "Network Tier 2", "Database Admin", "CAB Approval"];
  const groupIds: Record<string, string> = {};
  for (const g of groups) {
    const rows = await sql`
      INSERT INTO sys_user_group (name, description) VALUES (${g}, ${g + " assignment group"})
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id`;
    groupIds[g] = rows[0].id;
  }
  await sql`
    INSERT INTO sys_user_grmember (user_id, group_id)
    VALUES (${userIds["itil.fulfiller"]}::uuid, ${groupIds["Service Desk"]}::uuid)
    ON CONFLICT DO NOTHING`;
  await sql`
    INSERT INTO sys_user_grmember (user_id, group_id)
    VALUES (${userIds["network.tech"]}::uuid, ${groupIds["Network Tier 2"]}::uuid)
    ON CONFLICT DO NOTHING`;

  // SLA definitions
  const slas = [
    { name: "Incident Response Time (P1)", target: "response", duration_minutes: 15, start_condition: JSON.stringify({ priority: 1 }), stop_condition: JSON.stringify({ state: [2, 6, 7] }) },
    { name: "Incident Resolution Time (P1)", target: "resolution", duration_minutes: 240, start_condition: JSON.stringify({ priority: 1 }), stop_condition: JSON.stringify({ state: [6, 7] }) },
    { name: "Incident Resolution Time (P4)", target: "resolution", duration_minutes: 2880, start_condition: JSON.stringify({ priority: 4 }), stop_condition: JSON.stringify({ state: [6, 7] }) },
  ];
  for (const s of slas) {
    await sql`
      INSERT INTO contract_sla (name, target, target_table, duration_minutes, schedule, start_condition, stop_condition)
      VALUES (${s.name}, ${s.target}, 'incident', ${s.duration_minutes}, '24x7', ${s.start_condition}::jsonb, ${s.stop_condition}::jsonb)
      ON CONFLICT DO NOTHING`;
  }

  // CMDB sample with relations
  const ciWeb = await sql`
    INSERT INTO cmdb_ci (name, sys_class_name, operational_status, ip_address, fqdn)
    VALUES ('web-prod-01', 'cmdb_ci_server', 'operational', '10.0.1.10', 'web-prod-01.corp.local')
    ON CONFLICT DO NOTHING RETURNING id`;
  const ciDb = await sql`
    INSERT INTO cmdb_ci (name, sys_class_name, operational_status, ip_address, fqdn)
    VALUES ('db-prod-01', 'cmdb_ci_database', 'operational', '10.0.1.20', 'db-prod-01.corp.local')
    ON CONFLICT DO NOTHING RETURNING id`;
  const ciApp = await sql`
    INSERT INTO cmdb_ci (name, sys_class_name, operational_status, ip_address, fqdn)
    VALUES ('portal-service-prod', 'cmdb_ci_service', 'operational', '10.0.1.5', 'portal.corp.local')
    ON CONFLICT DO NOTHING RETURNING id`;

  const webId = ciWeb[0]?.id || (await sql`SELECT id FROM cmdb_ci WHERE name = 'web-prod-01'`)[0]?.id;
  const dbId = ciDb[0]?.id || (await sql`SELECT id FROM cmdb_ci WHERE name = 'db-prod-01'`)[0]?.id;
  const appId = ciApp[0]?.id || (await sql`SELECT id FROM cmdb_ci WHERE name = 'portal-service-prod'`)[0]?.id;

  if (appId && webId) {
    await sql`
      INSERT INTO cmdb_rel_ci (parent_id, child_id, relation_type)
      VALUES (${appId}::uuid, ${webId}::uuid, 'Depends On')
      ON CONFLICT DO NOTHING`;
  }
  if (webId && dbId) {
    await sql`
      INSERT INTO cmdb_rel_ci (parent_id, child_id, relation_type)
      VALUES (${webId}::uuid, ${dbId}::uuid, 'Runs On')
      ON CONFLICT DO NOTHING`;
  }

  // Sample incident
  const taskRows = await sql`
    INSERT INTO task (number, sys_class_name, short_description, description, priority, urgency, impact, state, opened_by)
    VALUES ('INC0000001', 'incident', 'Email client not syncing', 'Outlook fails to sync since morning.', 3, 2, 2, 2, ${userIds["abel.tuter"]}::uuid)
    ON CONFLICT (number) DO NOTHING RETURNING id`;
  if (taskRows.length > 0) {
    await sql`
      INSERT INTO incident (task_id, caller_id, category, cmdb_ci_id) VALUES (${taskRows[0].id}::uuid, ${userIds["abel.tuter"]}::uuid, 'software', ${appId ? `${appId}::uuid` : null})
      ON CONFLICT DO NOTHING`;
    await sql`
      INSERT INTO sys_journal_field (task_id, element, value, created_by)
      VALUES (${taskRows[0].id}::uuid, 'comments', 'Initial ticket logged by employee.', ${userIds["abel.tuter"]}::uuid)`;
  }

  // Sample Change Request
  const chgTask = await sql`
    INSERT INTO task (number, sys_class_name, short_description, description, priority, urgency, impact, state, opened_by)
    VALUES ('CHG0000001', 'change_request', 'Upgrade PostgreSQL cluster to v16.3', 'Apply maintenance minor update across database primary and read replicas.', 2, 2, 1, 2, ${userIds["itil.fulfiller"]}::uuid)
    ON CONFLICT (number) DO NOTHING RETURNING id`;
  if (chgTask.length > 0) {
    await sql`
      INSERT INTO change_request (task_id, type, risk, approval_state, cab_required, implementation_plan, backout_plan, test_plan)
      VALUES (${chgTask[0].id}::uuid, 'normal', 2, 'requested', true, '1. Drain connections.\n2. Apply apt package updates.\n3. Verify replica replication lag.', 'Rollback to snapshot snap-pg-20261005.', 'Execute regression queries against staging pool.')
      ON CONFLICT DO NOTHING`;
    await sql`
      INSERT INTO sys_journal_field (task_id, element, value, created_by)
      VALUES (${chgTask[0].id}::uuid, 'work_notes', 'CAB review meeting scheduled for Thursday 2 PM.', ${userIds["itil.fulfiller"]}::uuid)`;
  }

  // Sample Problem
  const prbTask = await sql`
    INSERT INTO task (number, sys_class_name, short_description, description, priority, urgency, impact, state, opened_by)
    VALUES ('PRB0000001', 'problem', 'Intermittent database connection pool timeouts', 'Applications experiencing connection exhaustion during morning peak load.', 2, 2, 1, 2, ${userIds["network.tech"]}::uuid)
    ON CONFLICT (number) DO NOTHING RETURNING id`;
  if (prbTask.length > 0) {
    await sql`
      INSERT INTO problem (task_id, root_cause, workaround, known_error)
      VALUES (${prbTask[0].id}::uuid, 'Connection leak in legacy reporting worker background thread.', 'Restart background worker service every 12 hours.', true)
      ON CONFLICT DO NOTHING`;
    await sql`
      INSERT INTO sys_journal_field (task_id, element, value, created_by)
      VALUES (${prbTask[0].id}::uuid, 'work_notes', 'Identified unclosed socket in worker thread #4.', ${userIds["network.tech"]}::uuid)`;
  }

  // Sample Knowledge Base articles
  const kbs = [
    {
      number: "KB0000001",
      short_description: "Troubleshooting Corporate VPN Connection Failures",
      category: "Network",
      text: "### Symptom\nUsers receive 'Gateway Timeout 504' or authentication reject when initiating WireGuard / OpenVPN sessions.\n\n### Resolution Steps\n1. Confirm SSO session is active.\n2. Verify local DNS resolver points to internal 10.0.0.2.\n3. Flush local cache: `ipconfig /flushdns`.\n4. If error persists, reboot VPN virtual tunnel interface.",
    },
    {
      number: "KB0000002",
      short_description: "Workaround: Database Connection Pool Exhaustion",
      category: "Database",
      text: "### Known Issue\nUnder heavy morning load, pool connections can reach saturation (max 100 conns).\n\n### Temporary Workaround\nRestart the legacy reporting worker:\n```bash\nsystemctl restart reporting-worker\n```\nPermanent fix is tracked under **PRB0000001**.",
    },
    {
      number: "KB0000003",
      short_description: "Requesting Hardware Upgrades & Ergonomic Equipment",
      category: "Hardware",
      text: "Employees eligible for equipment refresh (> 24 months tenure) may submit requests directly via the Service Catalog under **Workstation Accessories**.",
    },
  ];
  for (const k of kbs) {
    await sql`
      INSERT INTO kb_knowledge (number, short_description, text, category, workflow_state, author_id)
      VALUES (${k.number}, ${k.short_description}, ${k.text}, ${k.category}, 'published', ${userIds["itil.fulfiller"]}::uuid)
      ON CONFLICT (number) DO NOTHING`;
  }

  // Sample Service Catalog Items with dynamic variables
  const catItems = [
    {
      name: "Standard Incident Report",
      short_description: "General technical breakdown, service interruption, or bug report.",
      category: "Support",
      icon: "AlertCircle",
      variables: [
        { name: "short_description", label: "Issue Summary", type: "string", required: true },
        { name: "category", label: "Affected Service Area", type: "select", required: true, options: ["Software", "Hardware", "Network", "Database", "Inquiry"] },
        { name: "urgency", label: "Urgency Level", type: "select", required: true, options: ["1 - High", "2 - Medium", "3 - Low"] },
        { name: "impact", label: "Impact on Work", type: "select", required: true, options: ["1 - High", "2 - Medium", "3 - Low"] },
        { name: "description", label: "Steps to Reproduce / Details", type: "textarea", required: false },
      ],
    },
    {
      name: "Developer Workstation Provisioning",
      short_description: "Request a configured engineering laptop with local developer toolchains.",
      category: "Hardware",
      icon: "Laptop",
      variables: [
        { name: "os_choice", label: "Operating System", type: "select", required: true, options: ["macOS Sequoia (M3 Max)", "Ubuntu 24.04 LTS", "Windows 11 Enterprise"] },
        { name: "memory", label: "Memory Configuration", type: "select", required: true, options: ["32 GB Unified Memory", "64 GB Unified Memory", "128 GB Unified Memory"] },
        { name: "monitors", label: "Desk Display Preference", type: "select", required: true, options: ["Dual 27-inch 4K Displays", "Single 34-inch Ultrawide Curved", "Standard 24-inch Monitor"] },
        { name: "justification", label: "Business Need & Project", type: "textarea", required: true },
      ],
    },
    {
      name: "AWS Cloud Sandbox Account",
      short_description: "Isolated cloud account for architectural prototypes and experiments.",
      category: "Cloud",
      icon: "Cloud",
      variables: [
        { name: "cloud_provider", label: "Cloud Platform", type: "select", required: true, options: ["AWS", "Google Cloud", "Azure"] },
        { name: "budget_tier", label: "Monthly Spend Guardrail", type: "select", required: true, options: ["$250 / month", "$1,000 / month", "$5,000 / month"] },
        { name: "region", label: "Primary Deployment Region", type: "select", required: true, options: ["us-east-1 (N. Virginia)", "us-west-2 (Oregon)", "eu-central-1 (Frankfurt)"] },
        { name: "expiry_weeks", label: "Sandbox Duration", type: "select", required: true, options: ["2 Weeks", "4 Weeks", "12 Weeks"] },
        { name: "purpose", label: "Experiment Objectives", type: "textarea", required: true },
      ],
    },
  ];

  for (const item of catItems) {
    await sql`
      INSERT INTO sc_cat_item (name, short_description, category, icon, variables, active)
      VALUES (${item.name}, ${item.short_description}, ${item.category}, ${item.icon}, ${JSON.stringify(item.variables)}::jsonb, true)
      ON CONFLICT DO NOTHING`;
  }

  console.log("Seed complete.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
