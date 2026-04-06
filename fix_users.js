const fs = require('fs');

let sql = fs.readFileSync('onesta_db.sql', 'utf8');

// The line has multiple value tuples separated by `),(`, we want to turn it into multiple statements
// Match: `INSERT INTO \`users\` VALUES (...);`
sql = sql.replace(/INSERT INTO `users` VALUES (.*?);/s, (match, inner) => {
    // split by `),(`
    let parts = inner.split('),(');
    return parts.map((p, idx) => {
        let cleanP = p;
        if (idx === 0) cleanP = cleanP.substring(1); // remove first `(`
        if (idx === parts.length - 1) cleanP = cleanP.substring(0, cleanP.length - 1); // remove last `)`
        return `INSERT INTO \`users\` VALUES (${cleanP});`;
    }).join('\n');
});

// Since other tables might also have long inserts causing issues, let's just write this specific fix and see.
// Also, another issue might be the `\r\n` or `\n` getting messed up inside strings, or some weird characters.
fs.writeFileSync('onesta_db.sql', sql);
console.log('Fixed users insert statement!');
