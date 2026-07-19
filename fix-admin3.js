const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html') && f !== 'login.html');

for (const file of files) {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // The previous bad replace was:
    // onclick='openModal(${JSON.stringify(page).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})'
    // or similar for previewPost.
    
    // Let's use a regex to capture the function name (openModal, previewPost, editUnit, etc.)
    // and the object name (page, post, unit, etc.)
    
    // We will look for anything that looks like:
    // onclick='functionName(${JSON.stringify(objName).replace...})'
    // and replace it with the bulletproof version:
    // onclick="functionName(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(objName)).replace(/'/g, "%27")}')))"
    
    const regex = /onclick='([a-zA-Z0-9_]+)\(\$\{JSON\.stringify\(([a-zA-Z0-9_]+)\)(?:\.replace\([^)]+\))+(?:\.replace\([^)]+\))?\}\)'/g;
    
    content = content.replace(regex, (match, funcName, objName) => {
        return `onclick="if(event) event.preventDefault(); ${funcName}(JSON.parse(decodeURIComponent('\${encodeURIComponent(JSON.stringify(${objName})).replace(/'/g, \\"%27\\")}')))"`;
    });
    
    // Some might not have replace at all if my previous regex missed them:
    const regex2 = /onclick='([a-zA-Z0-9_]+)\(\$\{JSON\.stringify\(([a-zA-Z0-9_]+)\)\}\)'/g;
    content = content.replace(regex2, (match, funcName, objName) => {
        return `onclick="if(event) event.preventDefault(); ${funcName}(JSON.parse(decodeURIComponent('\${encodeURIComponent(JSON.stringify(${objName})).replace(/'/g, \\"%27\\")}')))"`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed Base64 onclick in', file);
}
