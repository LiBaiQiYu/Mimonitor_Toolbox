import { copyFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../../');
const targetDir = join(__dirname, '../src-tauri/bin');

if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
}

// Windows files
const windowsFiles = ['adb.exe', 'AdbWinApi.dll', 'AdbWinUsbApi.dll'];

// macOS/Linux files
const unixFiles = ['adb'];

// Copy Windows files
for (const file of windowsFiles) {
    const src = join(projectRoot, file);
    const dest = join(targetDir, file);
    if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`Copied ${file}`);
    } else {
        console.warn(`Warning: ${file} not found in project root`);
    }
}

// Copy macOS/Linux files
for (const file of unixFiles) {
    const src = join(projectRoot, file);
    const dest = join(targetDir, file);
    if (existsSync(src)) {
        copyFileSync(src, dest);
        chmodSync(dest, 0o755); // Make executable
        console.log(`Copied ${file}`);
    } else {
        console.warn(`Warning: ${file} not found in project root (needed for macOS/Linux builds)`);
    }
}
