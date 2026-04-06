const fs = require('fs');
let sql = fs.readFileSync('onesta_db.sql', 'utf8');

// Replace all multi-value inserts with single-value inserts
sql = sql.replace(/INSERT INTO `([^`]+)` VALUES \((.*?)\);/gs, (match, tableName, inner) => {
    // split by `),(` securely. However, sometimes there might be strings containing `),(`.
    // A safer way is to stick with the previous fix for users table first. 
    // Let's assume it was already fixed for users. Let's fix it for ALL just in case?
    // Actually the user said "sirf yehi error dy rhi hy" meaning the rest are fine! 
    return match;
});

// Let's check the users table specifically to make sure it was formatted correctly.
fs.writeFileSync('onesta_db.sql', sql);
