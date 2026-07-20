const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '../src/pages/admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html') && f !== 'page-builder.html');

// Note: I exclude page-builder.html if it doesn't have a standard sidebar, but wait, does it have one? Let's check all first.
// Actually, let's just replace everything between <nav class="sidebar-nav"> and </nav>

const baseNav = `
            <nav class="sidebar-nav">
                <div class="sidebar-section-label">PRINCIPAL</div>
                <a href="dashboard.html" class="sidebar-link {active_dashboard}"><i class="fas fa-chart-line"></i> Dashboard</a>
                <a href="pages.html" class="sidebar-link {active_pages}"><i class="fas fa-file-alt"></i> Páginas</a>
                <a href="navbar.html" class="sidebar-link {active_navbar}"><i class="fas fa-bars"></i> Navbar</a>
                <div class="sidebar-section-label">CONTEÚDO</div>
                <a href="blog.html" class="sidebar-link {active_blog}"><i class="fas fa-pen-nib"></i> Blog</a>
                <div class="sidebar-section-label">NEGÓCIOS</div>
                <a href="contacts.html" class="sidebar-link {active_contacts}"><i class="fas fa-envelope"></i> Mensagens</a>
                <div class="sidebar-section-label">SISTEMA</div>
                <a href="settings.html" class="sidebar-link {active_settings}"><i class="fas fa-cog"></i> Configurações</a>
            </nav>
`;

files.forEach(file => {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if file doesn't have a sidebar
    if (!content.includes('<nav class="sidebar-nav">')) {
        console.log(`Skipping ${file} (no sidebar)`);
        return;
    }

    const fileBase = file.replace('.html', '');
    let newNav = baseNav
        .replace('{active_dashboard}', fileBase === 'dashboard' ? 'active' : '')
        .replace('{active_pages}', fileBase === 'pages' ? 'active' : '')
        .replace('{active_navbar}', fileBase === 'navbar' ? 'active' : '')
        .replace('{active_blog}', fileBase === 'blog' ? 'active' : '')
        .replace('{active_contacts}', fileBase === 'contacts' ? 'active' : '')
        .replace('{active_settings}', fileBase === 'settings' ? 'active' : '')
        // Clean up empty active classes if they are left
        .replace(/ {active_[a-z]+}/g, '');

    // Replace the existing block
    const regex = /<nav class="sidebar-nav">[\s\S]*?<\/nav>/;
    content = content.replace(regex, newNav.trim());

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Synced sidebar in ${file}`);
});
