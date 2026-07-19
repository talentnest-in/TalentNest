const fs = require('fs');
const glob = require('glob');
const path = require('path');
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', { cwd: 'c:/Users/Pravin/OneDrive/Desktop/TalentNest/frontend', absolute: true });

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  content = content.replace(/src=\{\`\$\{BACKEND_URL\}\$\{([^}]+)\}\`\}/g, (match, p1) => {
    return `src={${p1}?.startsWith('http') ? ${p1} : \`\${BACKEND_URL}\${${p1}}\`}`;
  });

  content = content.replace(/href=\{\`\$\{BACKEND_URL\}\$\{([^}]+)\}\`\}/g, (match, p1) => {
    return `href={${p1}?.startsWith('http') ? ${p1} : \`\${BACKEND_URL}\${${p1}}\`}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
