const fs = require('fs');

function refactorFile(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    
    if (!content.includes('import styles from "./Auth.module.css"')) {
        content = content.replace('import API from "../services/api";', 'import API from "../services/api";\nimport styles from "./Auth.module.css";');
    }
    
    content = content.replace(/style=\{styles\.([a-zA-Z0-9_]+)\}/g, 'className={styles.$1}');
    
    const stylesStart = content.indexOf('const styles = {');
    if (stylesStart !== -1) {
        content = content.substring(0, stylesStart);
    }
    
    fs.writeFileSync(filename, content, 'utf8');
    console.log(filename + ' refactored!');
}

refactorFile('src/pages/Login.js');
refactorFile('src/pages/Register.js');
