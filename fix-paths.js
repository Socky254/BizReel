const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  walkDir(distPath, (filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.json')) {
      let content = fs.readFileSync(filePath, 'utf8');

      // Fix 1: Ensure absolute paths are converted to relative for file:// protocol
      // Matches "/assets/", "/_expo/", etc. but only if preceded by quote or equals
      let fixedContent = content
        .replace(/(["'=])\/assets\//g, '$1./assets/')
        .replace(/(["'=])\/_expo\//g, '$1./_expo/')
        .replace(/(["'=])\/favicon\.ico/g, '$1./favicon.ico');

      // Fix 2: Vector Icons Fix
      // Expo Vector Icons on Web sometimes try to load from root /assets/fonts
      // We force them to look in the relative ./assets folder
      fixedContent = fixedContent.replace(/"\/assets\/fonts\//g, '"./assets/fonts/');

      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`Fixed paths in: ${path.relative(distPath, filePath)}`);
      }
    }
  });
  console.log('Path optimization complete.');
} else {
  console.error('Error: dist folder not found.');
  process.exit(1);
}
