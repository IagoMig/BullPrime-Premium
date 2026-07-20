const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '../src/pages/admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html'));

const removeRegexes = [
    /<a href="media\.html" class="sidebar-link[^"]*">.*?<\/a>\s*/g,
    /<a href="cuts\.html" class="sidebar-link[^"]*">.*?<\/a>\s*/g,
    /<a href="units\.html" class="sidebar-link[^"]*">.*?<\/a>\s*/g,
    /<a href="events\.html" class="sidebar-link[^"]*">.*?<\/a>\s*/g,
];

const navbarLinkHtml = `
                <a href="navbar.html" class="sidebar-link">
                    <i class="fas fa-bars"></i> Navbar
                </a>`;

files.forEach(file => {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the old links
    removeRegexes.forEach(regex => {
        content = content.replace(regex, '');
    });

    // Add Navbar link if it doesn't exist
    if (!content.includes('navbar.html') && content.includes('sidebar-nav')) {
        // Insert after Dashboard or Pages link
        content = content.replace(/(<a href="pages\.html" class="sidebar-link[^"]*">.*?<\/a>)/, `$1${navbarLinkHtml}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated sidebar in ${file}`);
});
