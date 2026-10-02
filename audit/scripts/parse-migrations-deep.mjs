import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve('supabase/migrations');
const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

const tables = new Map(); // name -> { createdIn, rlsEnabled: false, rlsForced: false, rlsEnabledIn: [], rlsForcedIn: [] }
const functions = new Map(); // name -> { file, definer: false, searchPath: null, grants: [] }
const policies = [];
const constraints = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

  // Tables
  const createTableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:public\.)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    const tName = match[1].toLowerCase();
    if (!tables.has(tName)) {
      tables.set(tName, {
        createdIn: file,
        rlsEnabled: false,
        rlsForced: false,
        rlsEnabledIn: [],
        rlsForcedIn: []
      });
    }
  }

  // RLS Enable
  const enableRlsRegex = /ALTER\s+TABLE(?:\s+IF\s+EXISTS)?\s+(?:public\.)?([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((match = enableRlsRegex.exec(content)) !== null) {
    const tName = match[1].toLowerCase();
    if (tables.has(tName)) {
      tables.get(tName).rlsEnabled = true;
      tables.get(tName).rlsEnabledIn.push(file);
    }
  }

  // RLS Force
  const forceRlsRegex = /ALTER\s+TABLE(?:\s+IF\s+EXISTS)?\s+(?:public\.)?([a-zA-Z0-9_]+)\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((match = forceRlsRegex.exec(content)) !== null) {
    const tName = match[1].toLowerCase();
    if (tables.has(tName)) {
      tables.get(tName).rlsForced = true;
      tables.get(tName).rlsForcedIn.push(file);
    }
  }

  // Functions
  const funcRegex = /CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+([a-zA-Z0-9_.]+)\s*\(([^)]*)\)/gi;
  while ((match = funcRegex.exec(content)) !== null) {
    const fName = match[1].toLowerCase();
    const args = match[2].trim();
    // look forward in content around this function definition
    const funcSlice = content.slice(match.index, match.index + 1200);
    const isDefiner = /SECURITY\s+DEFINER/i.test(funcSlice);
    const searchPathMatch = /SET\s+search_path\s*=\s*([^;\n]+)/i.exec(funcSlice);
    const searchPath = searchPathMatch ? searchPathMatch[1].trim() : null;

    functions.set(`${fName}(${args})`, {
      name: fName,
      args,
      file,
      definer: isDefiner,
      searchPath
    });
  }

  // Grants
  const grantRegex = /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+([a-zA-Z0-9_.]+)[^;]+TO\s+([^;\n]+)/gi;
  while ((match = grantRegex.exec(content)) !== null) {
    const fName = match[1].toLowerCase();
    const toRole = match[2].trim();
    // find matching func
    for (const [key, val] of functions.entries()) {
      if (val.name === fName) {
        val.grants.push({ file, toRole });
      }
    }
  }

  // Policies
  const policyRegex = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)(?:\s+FOR\s+([a-zA-Z]+))?(?:\s+TO\s+([a-zA-Z0-9_, ]+))?/gi;
  while ((match = policyRegex.exec(content)) !== null) {
    policies.push({
      name: match[1],
      table: match[2].toLowerCase(),
      forOp: match[3] || 'ALL',
      toRole: match[4] || 'public',
      file
    });
  }

  // Constraints: check for message length, attachment count, size
  const checkRegex = /CHECK\s*\(([^)]*(?:char_length|length|octet_length|size|count|status)[^)]*)\)/gi;
  while ((match = checkRegex.exec(content)) !== null) {
    constraints.push({ file, constraint: match[1].trim() });
  }
}

const report = {
  totalTables: tables.size,
  tables: Array.from(tables.entries()).map(([name, data]) => ({ name, ...data })),
  tablesWithoutRls: Array.from(tables.entries()).filter(([_, d]) => !d.rlsEnabled).map(([n]) => n),
  tablesWithoutForcedRls: Array.from(tables.entries()).filter(([_, d]) => !d.rlsForced).map(([n]) => n),
  functions: Array.from(functions.entries()).map(([key, data]) => ({ signature: key, ...data })),
  policiesCount: policies.length,
  constraints
};

fs.writeFileSync(path.resolve('audit/evidence/deep_migration_analysis.json'), JSON.stringify(report, null, 2));

let humanReadable = `=== NexaLink Deep Migration Schema Analysis ===\n\n`;
humanReadable += `Total Tables Created: ${report.totalTables}\n`;
humanReadable += `Tables WITHOUT RLS Enabled (${report.tablesWithoutRls.length}):\n`;
report.tablesWithoutRls.forEach(t => humanReadable += `  - ${t}\n`);

humanReadable += `\nTables WITH RLS Enabled but WITHOUT FORCE RLS (${report.tablesWithoutForcedRls.length}):\n`;
report.tablesWithoutForcedRls.forEach(t => humanReadable += `  - ${t}\n`);

humanReadable += `\nFunctions and RPCs (${report.functions.length}):\n`;
report.functions.forEach(f => {
  humanReadable += `  - ${f.signature} [file: ${f.file}] (Definer: ${f.definer}, search_path: ${f.searchPath || 'NOT SET'})\n`;
});

humanReadable += `\nMessage / Content Constraints Found:\n`;
report.constraints.forEach(c => {
  humanReadable += `  - [${c.file}]: ${c.constraint}\n`;
});

fs.writeFileSync(path.resolve('audit/evidence/deep_migration_analysis.txt'), humanReadable);
console.log(humanReadable);
