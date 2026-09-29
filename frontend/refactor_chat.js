const fs = require('fs');

let content = fs.readFileSync('src/pages/Chat.jsx', 'utf8');

if (!content.includes('import styles from "./Chat.module.css"')) {
    content = content.replace('import { getAvatarColor } from "../App";', 'import { getAvatarColor } from "../App";\nimport styles from "./Chat.module.css";');
}

// Simple replacements
content = content.replace(/style=\{styles\.([a-zA-Z0-9_]+)\}/g, 'className={styles.$1}');

// Dynamic replacements
content = content.replace(/style=\{\{\s*\.\.\.styles\.headerAvatar,\s*background: receiverColor\s*\}\}/g, 'className={styles.headerAvatar} style={{ background: receiverColor }}');
content = content.replace(/style=\{\{\s*\.\.\.styles\.msgAvatar,\s*background: isSelf \? senderColor : receiverColor,\s*\}\}/g, 'className={styles.msgAvatar} style={{ background: isSelf ? senderColor : receiverColor }}');
content = content.replace(/style=\{\{\s*\.\.\.styles\.bubble,\s*\.\.\.\(isSelf \? styles\.bubbleSelf : styles\.bubbleOther\),\s*\}\}/g, 'className={`${styles.bubble} ${isSelf ? styles.bubbleSelf : styles.bubbleOther}`}');
content = content.replace(/style=\{\{\s*\.\.\.styles\.sendBtn,\s*opacity: message\.trim\(\) \? 1 : 0\.5,\s*background: getAvatarColor\(userId\),\s*\}\}/g, 'className={styles.sendBtn} style={{ opacity: message.trim() ? 1 : 0.5, background: getAvatarColor(userId) }}');

const stylesStart = content.indexOf('const styles = {');
if (stylesStart !== -1) {
    const exportStart = content.indexOf('export default Chat;', stylesStart);
    if (exportStart !== -1) {
        content = content.substring(0, stylesStart);
    }
}

fs.writeFileSync('src/pages/Chat.jsx', content, 'utf8');
console.log('Chat.jsx refactored!');
