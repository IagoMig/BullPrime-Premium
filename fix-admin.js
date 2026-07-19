const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html') && f !== 'login.html');

for (const file of files) {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace JSON.stringify(...).replace(/'/g, "&#39;") with .replace(/'/g, "&#39;").replace(/"/g, "&quot;")
    content = content.replace(/\.replace\(\/\\'\/\w+, "&\#39;"\)/g, ".replace(/'/g, \"&#39;\").replace(/\"/g, \"&quot;\")");
    
    // For those missing the replace entirely:
    content = content.replace(/onclick='openModal\(\$\{JSON\.stringify\(([a-zA-Z0-9_]+)\)\}\)'/g, "onclick='openModal(${JSON.stringify($1).replace(/\\'/g, \"&#39;\").replace(/\\\"/g, \"&quot;\")})'");

    // Add onsubmit="event.preventDefault();" to all <form id="..."> that don't have it
    content = content.replace(/<form\s+id="([^"]+)">/g, '<form id="$1" onsubmit="event.preventDefault();">');
    
    // Add checkAuth() if it's missing (like in pages.html)
    if (!content.includes('checkAuth()') && content.includes('let supabase;')) {
        const authScript = `
        async function checkAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = 'login.html';
            }
        }
        checkAuth();
        `;
        content = content.replace(/(let supabase;.*?console\.error\(e\); \})/, `$1\n${authScript}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
}
