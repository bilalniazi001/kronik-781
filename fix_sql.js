const fs = require('fs');
let data = fs.readFileSync('onesta_db.sql', 'utf8');

// Replace the line causing the issue
data = data.replace('/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;', '');
data = data.replace('/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;', '/*!40014 SET FOREIGN_KEY_CHECKS=0 */;')

fs.writeFileSync('onesta_db.sql', data);
