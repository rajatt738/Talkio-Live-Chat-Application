const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Add import
if (!content.includes('import styles from "./App.module.css"')) {
    content = content.replace('import socket from "./socket";', 'import socket from "./socket";\nimport styles from "./App.module.css";');
}

// Simple style replacements
content = content.replace(/style=\{styles\.([a-zA-Z0-9_]+)\}/g, 'className={styles.$1}');

// Dynamic replacements
// style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : {}) }}
content = content.replace(/style=\{\{\s*\.\.\.styles\.sidebar,\s*\.\.\.\(isMobile \? styles\.sidebarMobile : \{\}\),\s*\}\}/g, 'className={`${styles.sidebar} ${isMobile ? styles.sidebarMobile : ""}`}');

// style={{ ...styles.userAvatar, width: 32, height: 32, fontSize: 13, background: getAvatarColor(user.username) }}
content = content.replace(/style=\{\{\s*\.\.\.styles\.userAvatar,\s*width: 32,\s*height: 32,\s*fontSize: 13,\s*background: getAvatarColor\(user\.username\),\s*\}\}/g, 'className={styles.userAvatar} style={{ width: 32, height: 32, fontSize: 13, background: getAvatarColor(user.username) }}');

// style={{ ...styles.userAvatar, background: getAvatarColor(user.username) }}
content = content.replace(/style=\{\{\s*\.\.\.styles\.userAvatar,\s*background: getAvatarColor\(user\.username\),\s*\}\}/g, 'className={styles.userAvatar} style={{ background: getAvatarColor(user.username) }}');

// style={{ ...styles.recentAvatar, background: getAvatarColor(name) }}
content = content.replace(/style=\{\{\s*\.\.\.styles\.recentAvatar,\s*background: getAvatarColor\(name\),\s*\}\}/g, 'className={styles.recentAvatar} style={{ background: getAvatarColor(name) }}');

// style={{ ...styles.recentItem, background: receiverId === name && chatStarted ? "#334155" : "transparent" }}
content = content.replace(/style=\{\{\s*\.\.\.styles\.recentItem,\s*background:(\s*)receiverId === name && chatStarted(\s*)\? "#334155"(\s*): "transparent",\s*\}\}/g, 'className={styles.recentItem} style={{ background: receiverId === name && chatStarted ? "#334155" : "transparent" }}');


// Remove the styles object from the bottom
const stylesStart = content.indexOf('const styles = {');
if (stylesStart !== -1) {
    const exportStart = content.indexOf('export default App;', stylesStart);
    if (exportStart !== -1) {
        content = content.substring(0, stylesStart) + content.substring(exportStart);
    }
}

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('App.js refactored!');
