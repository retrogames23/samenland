// Test support (Paket C): a complete rights overview of the public schema — every table, view, sequence and function
// (every overload) with owner, SECURITY DEFINER/INVOKER, search_path and the effective privileges of PUBLIC, anon,
// authenticated and service_role. Machine-readable (JSON) and readable (Markdown).
import type postgres from "postgres";

export const ROLES = ["PUBLIC", "anon", "authenticated", "service_role"] as const;
export type Role = (typeof ROLES)[number];
export type RightsEntry = {
  kind: "table" | "view" | "sequence" | "function";
  name: string;
  /** identity arguments (functions) */
  args?: string;
  owner: string;
  definer?: boolean;
  searchPath?: string | null;
  returns?: string;
  rls?: boolean;
  /** effective privileges per role: tables r a w d D x t (SELECT INSERT UPDATE DELETE TRUNCATE REFERENCES TRIGGER), sequences r U w, functions X */
  privileges: Record<Role, string>;
  /** tables: what a role can actually do through PostgREST — the privilege AND (no RLS, or BYPASSRLS, or a policy for the
   *  command that applies to the role); letters r a w d */
  effective?: Record<Role, string>;
};

const TABLE_PRIVS: [string, string][] = [["r", "SELECT"], ["a", "INSERT"], ["w", "UPDATE"], ["d", "DELETE"], ["D", "TRUNCATE"], ["x", "REFERENCES"], ["t", "TRIGGER"]];
const SEQ_PRIVS: [string, string][] = [["r", "SELECT"], ["U", "USAGE"], ["w", "UPDATE"]];

/** PUBLIC is not a role for has_*_privilege: it is read from the ACL (no ACL = the object type's default). */
export async function rightsReport(sql: postgres.Sql): Promise<RightsEntry[]> {
  const out: RightsEntry[] = [];
  const rels = await sql`select c.oid, c.relname, c.relkind, pg_get_userbyid(c.relowner) owner, c.relrowsecurity rls, c.relacl::text acl
    from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'S', 'p') order by c.relname`;
  for (const r of rels) {
    const kind = r["relkind"] === "S" ? "sequence" : r["relkind"] === "r" || r["relkind"] === "p" ? "table" : "view";
    const privs = kind === "sequence" ? SEQ_PRIVS : TABLE_PRIVS;
    const privileges = {} as Record<Role, string>;
    for (const role of ROLES) {
      if (role === "PUBLIC") { privileges[role] = publicFromAcl(r["acl"] as string | null, privs.map((p) => p[0]).join(""), ""); continue; }
      let s = "";
      for (const [c, p] of privs) {
        const fn = kind === "sequence" ? "has_sequence_privilege" : "has_table_privilege";
        const [x] = await sql.unsafe(`select ${fn}($1, $2::oid, $3) ok`, [role, r["oid"], p]);
        if (x!["ok"]) s += c;
      }
      privileges[role] = s;
    }
    let effective: Record<Role, string> | undefined;
    if (kind === "table") {
      effective = {} as Record<Role, string>;
      const pol = await sql`select cmd, roles::text[] roles from pg_policies where schemaname = 'public' and tablename = ${r["relname"] as string}`;
      for (const role of ROLES) {
        const bypass = role === "service_role" || !r["rls"];
        let e = "";
        for (const [c, cmd] of [["r", "SELECT"], ["a", "INSERT"], ["w", "UPDATE"], ["d", "DELETE"]] as const) {
          if (!privileges[role].includes(c)) continue;
          const applies = pol.some((p) => (p["cmd"] === cmd || p["cmd"] === "ALL") && ((p["roles"] as string[]).includes("public") || (p["roles"] as string[]).includes(role.toLowerCase())));
          if (bypass || applies) e += c;
        }
        effective[role] = e;
      }
    }
    out.push({ kind, name: r["relname"] as string, owner: r["owner"] as string, ...(kind === "table" && effective ? { rls: r["rls"] as boolean, effective } : {}), privileges });
  }
  const fns = await sql`select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) args, pg_get_userbyid(p.proowner) owner, p.prosecdef,
      (select c from unnest(p.proconfig) c where c like 'search_path=%') sp, p.prorettype::regtype::text rt, p.proacl::text acl
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' order by p.proname, 2`;
  for (const f of fns) {
    const privileges = {} as Record<Role, string>;
    for (const role of ROLES) {
      if (role === "PUBLIC") { privileges[role] = publicFromAcl(f["acl"] as string | null, "X", "X"); continue; }
      const [x] = await sql.unsafe(`select has_function_privilege($1, $2::oid, 'EXECUTE') ok`, [role, f["oid"]]);
      privileges[role] = x!["ok"] ? "X" : "";
    }
    out.push({ kind: "function", name: f["proname"] as string, args: f["args"] as string, owner: f["owner"] as string, definer: f["prosecdef"] as boolean,
      searchPath: (f["sp"] as string | null)?.replace("search_path=", "") ?? null, returns: f["rt"] as string, privileges });
  }
  return out;
}
/** The PUBLIC entry of an ACL ("=X/postgres"), or the default when the object has no ACL. */
function publicFromAcl(acl: string | null, all: string, dflt: string) {
  if (acl == null) return dflt;
  const m = /(?:^\{|,)=([a-zA-Z*]*)\//.exec(acl);
  return m ? [...m[1]!.replace(/\*/g, "")].filter((c) => all.includes(c)).join("") : "";
}
export const key = (e: RightsEntry) => `${e.kind} ${e.name}${e.args !== undefined ? `(${e.args})` : ""}`;

/** Readable overview; `focus` (names) first, then the rest. */
export function rightsMarkdown(title: string, entries: RightsEntry[], focus: readonly string[] = []): string {
  const cell = (e: RightsEntry, r: Role) => (e.privileges[r] || "–") + (e.effective && e.effective[r] !== e.privileges[r].replace(/[Dxt]/g, "") ? ` (wirksam: ${e.effective[r] || "–"})` : "");
  const row = (e: RightsEntry) => `| ${e.kind} | \`${e.name}${e.args !== undefined ? `(${e.args})` : ""}\` | ${e.kind === "function" ? (e.definer ? "DEFINER" : "INVOKER") + (e.returns === "trigger" ? ", Trigger" : "") : e.rls ? "RLS an" : e.kind === "table" ? "RLS aus" : ""} | ${e.kind === "function" ? (e.searchPath ?? "–") : ""} | ${ROLES.map((r) => cell(e, r)).join(" | ")} |`;
  const head = `| Art | Objekt | Sicherheit | search_path | ${ROLES.join(" | ")} |\n|---|---|---|---|${ROLES.map(() => "---").join("|")}|`;
  const isFocus = (e: RightsEntry) => focus.includes(e.name);
  return `# ${title}\n\nRechte: Tabellen r a w d D x t (SELECT INSERT UPDATE DELETE TRUNCATE REFERENCES TRIGGER), Sequenzen r U w, Funktionen X (EXECUTE). „–“ = kein Recht. ` +
    `„wirksam“: was über PostgREST tatsächlich möglich ist (Recht UND RLS-Policy für den Befehl; service_role umgeht RLS). ` +
    `EXECUTE auf Trigger-Funktionen prüft PostgreSQL beim Feuern nicht, und PostgREST bietet sie nicht als RPC an.\n\n` +
    `## Hochzeits-, Abrechnungs-, Kassen- und Ressourcenobjekte\n\n${head}\n${entries.filter(isFocus).map(row).join("\n")}\n\n` +
    `## Alle übrigen Objekte im Schema public\n\n${head}\n${entries.filter((e) => !isFocus(e)).map(row).join("\n")}\n`;
}
/** Entries whose privileges differ between two reports, plus added/removed objects. */
export function rightsDiff(before: RightsEntry[], after: RightsEntry[]) {
  const b = new Map(before.map((e) => [key(e), e])), a = new Map(after.map((e) => [key(e), e]));
  const changed: { object: string; before: Record<Role, string> | null; after: Record<Role, string> | null }[] = [];
  for (const [k, e] of a) { const o = b.get(k); if (!o || JSON.stringify(o.privileges) !== JSON.stringify(e.privileges) || o.definer !== e.definer) changed.push({ object: k, before: o?.privileges ?? null, after: e.privileges }); }
  for (const [k, e] of b) if (!a.has(k)) changed.push({ object: k, before: e.privileges, after: null });
  return changed.sort((x, y) => x.object.localeCompare(y.object));
}
