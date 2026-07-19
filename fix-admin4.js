const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html') && f !== 'login.html');

for (const file of files) {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We need to replace \\"%27\\" with "%27"
    content = content.replace(/\\"%27\\"/g, '"%27"');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed syntax error in', file);
}
