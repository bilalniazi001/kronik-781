const fs = require('fs');

const inputPath = 'd:\\kronik-781-main\\onesta_db.sql';
const outputPath = 'd:\\kronik-781-main\\onesta_db_arranged.sql';

const sql = fs.readFileSync(inputPath, 'utf8');

// Use simple regex to split that supports both \n and \r\n
const parts = sql.split(/--\r?\n-- Table structure for table `/);

if (parts.length <= 1) {
    console.log("Could not split by table structure marker. Check file format.");
    process.exit(1);
}

const header = parts[0];
const tableBlocks = {};
const unmappedBlocks = [];

for (let i = 1; i < parts.length; i++) {
    const block = parts[i];
    const tableName = block.split('`')[0];
    
    // Check if it's actually a table name
    if (tableName && block.includes('CREATE TABLE')) {
        tableBlocks[tableName] = '--\n-- Table structure for table `' + block;
    } else {
        unmappedBlocks.push('--\n-- Table structure for table `' + block);
    }
}

// 1. Independent Tables
// 2. Base dependent tables
// 3. Application tables dependent on core tables
const order = [
  "settings",
  "admins",
  "shifts",
  "assets",
  "leave_types",
  "audit_logs",
  "users",
  "announcements",
  "asset_assignments",
  "break_requests",
  "kpis",
  "notifications",
  "performance_reviews",
  "public_holidays",
  "tickets",
  "user_documents",
  "employee_leave_balances",
  "leave_applications",
  "cancellation_requests",
  "leave_application_details",
  "attendance"
];

let newSql = header;

// First loop for ordered tables
for(let table of order) {
  if(tableBlocks[table]) {
    newSql += tableBlocks[table];
    delete tableBlocks[table]; // Remove from map so we don't duplicate
  } else {
    // Some might not exist, which is fine
  }
}

// Any remaining tables that were not in our explicit order list
const remainingTables = Object.keys(tableBlocks);
if (remainingTables.length > 0) {
    console.log("Adding unranked tables at the end: ", remainingTables);
    for (let rt of remainingTables) {
        newSql += tableBlocks[rt];
    }
}

// Add any blocks that failed to parse a table name
for (let ub of unmappedBlocks) {
    newSql += ub;
}

fs.writeFileSync(outputPath, newSql);
console.log('Created ' + outputPath + ' successfully!');
