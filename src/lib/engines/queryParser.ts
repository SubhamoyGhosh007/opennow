// Parses ServiceNow sysparm_query: e.g. "priority=1^active=true^state!=7^short_descriptionLIKEemail^ORpriority=2"
export interface ParsedCondition {
  field: string;
  op: string;
  value: string;
  orGroup: boolean;
}

export function parseSysparmQuery(query?: string): ParsedCondition[] {
  if (!query) return [];
  const parts = query.split("^");
  const out: ParsedCondition[] = [];
  let orNext = false;
  for (const part of parts) {
    if (part === "OR") {
      orNext = true;
      continue;
    }
    if (part.startsWith("OR")) {
      orNext = true;
    }
    const clean = part.replace(/^OR/, "");
    const m = clean.match(/^([^=!<>~]+)((?:!=|=|LIKE|STARTSWITH|ENDSWITH|IN|NOTIN|>|<|>=|<=))(.*)$/);
    if (!m) continue;
    out.push({ field: m[1], op: m[2], value: m[3], orGroup: orNext });
    orNext = false;
  }
  return out;
}

function escapeLiteral(val: string): string {
  return "'" + String(val).replace(/'/g, "''") + "'";
}

// Builds a safely escaped WHERE clause for query filtering.
export function buildWhereClause(conditions: ParsedCondition[], allowedFields: Set<string>) {
  const andClauses: string[] = [];
  const orClauses: string[] = [];
  const values: string[] = [];
  for (const c of conditions) {
    if (!allowedFields.has(c.field)) continue;
    let frag = "";
    const isBool = c.value === "true" || c.value === "false";
    const isNumeric = /^-?\d+$/.test(c.value);
    const lit = isBool ? (c.value === "true" ? "true" : "false") : isNumeric ? c.value : escapeLiteral(c.value);

    switch (c.op) {
      case "=":
        frag = `"${c.field}" = ${lit}`;
        values.push(c.value);
        break;
      case "!=":
        frag = `"${c.field}" != ${lit}`;
        values.push(c.value);
        break;
      case "LIKE":
        frag = `"${c.field}" ILIKE ${escapeLiteral(`%${c.value}%`)}`;
        values.push(`%${c.value}%`);
        break;
      case "STARTSWITH":
        frag = `"${c.field}" ILIKE ${escapeLiteral(`${c.value}%`)}`;
        values.push(`${c.value}%`);
        break;
      case "ENDSWITH":
        frag = `"${c.field}" ILIKE ${escapeLiteral(`%${c.value}`)}`;
        values.push(`%${c.value}`);
        break;
      case "IN": {
        const inVals = c.value.split(",").map((v) => escapeLiteral(v.trim())).join(", ");
        frag = `"${c.field}" IN (${inVals || "NULL"})`;
        values.push(c.value);
        break;
      }
      default:
        continue;
    }
    if (c.orGroup) orClauses.push(frag);
    else andClauses.push(frag);
  }
  let clause = "";
  if (andClauses.length) clause += andClauses.join(" AND ");
  if (orClauses.length) {
    const orPart = `(${orClauses.join(" OR ")})`;
    clause = clause ? `${clause} AND ${orPart}` : orPart;
  }
  return { clause: clause ? `WHERE ${clause}` : "", values };
}

