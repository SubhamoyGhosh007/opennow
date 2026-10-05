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

  // CMDB sample
  await sql`
    INSERT INTO cmdb_ci (name, sys_class_name, ip_address, fqdn)
    VALUES ('web-prod-01', 'cmdb_ci_server', '10.0.1.10', 'web-prod-01.corp.local')
    ON CONFLICT DO NOTHING`;
  await sql`
    INSERT INTO cmdb_ci (name, sys_class_name, ip_address, fqdn)
    VALUES ('db-prod-01', 'cmdb_ci_database', '10.0.1.20', 'db-prod-01.corp.local')
    ON CONFLICT DO NOTHING`;

  // Sample incident
  const taskRows = await sql`
    INSERT INTO task (number, sys_class_name, short_description, description, priority, urgency, impact, state, opened_by)
    VALUES ('INC0000001', 'incident', 'Email client not syncing', 'Outlook fails to sync since morning.', 3, 2, 2, 2, ${userIds["abel.tuter"]}::uuid)
    ON CONFLICT (number) DO NOTHING RETURNING id`;
  if (taskRows.length > 0) {
    await sql`
      INSERT INTO incident (task_id, caller_id, category) VALUES (${taskRows[0].id}::uuid, ${userIds["abel.tuter"]}::uuid, 'software')
      ON CONFLICT DO NOTHING`;
  }

  console.log("Seed complete.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
