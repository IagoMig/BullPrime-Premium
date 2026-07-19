const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html') && f !== 'login.html');

for (const file of files) {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Very simple string replace
    content = content.replace(/.replace\(\/'\/g, "&\#39;"\)/g, ".replace(/'/g, \"&#39;\").replace(/\"/g, \"&quot;\")");
    content = content.replace(/.replace\(\/'\/g, '&\#39;'\)/g, ".replace(/'/g, \"&#39;\").replace(/\"/g, \"&quot;\")");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed quotes in', file);
}
