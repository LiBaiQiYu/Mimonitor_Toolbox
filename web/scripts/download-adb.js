#!/usr/bin/env node

/**
 * Download ADB binaries for all platforms
 * Run this script to get the required adb binaries for building
 */

import { createWriteStream, existsSync, mkdirSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../../');
const binDir = join(projectRoot, 'web/src-tauri/bin');

const PLATFORM_TOOLS_URL = 'https://dl.google.com/android/repository/platform-tools-latest-';

const platforms = {
    windows: {
        url: `${PLATFORM_TOOLS_URL}windows.zip`,
        files: ['platform-tools/adb.exe', 'platform-tools/AdbWinApi.dll', 'platform-tools/AdbWinUsbApi.dll']
    },
    macos: {
        url: `${PLATFORM_TOOLS_URL}darwin.zip`,
        files: ['platform-tools/adb']
    },
    linux: {
        url: `${PLATFORM_TOOLS_URL}linux.zip`,
        files: ['platform-tools/adb']
    }
};

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(dest);
        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }
        }).on('error', reject);
    });
}

async function main() {
    console.log('ADB Binary Downloader');
    console.log('====================\n');

    if (!existsSync(binDir)) {
        mkdirSync(binDir, { recursive: true });
    }

    console.log('To build for macOS, you need to download the macOS version of ADB.');
    console.log('Download from: https://developer.android.com/studio/releases/platform-tools');
    console.log('\nAfter downloading:');
    console.log('1. Extract the zip file');
    console.log('2. Copy "adb" to: web/src-tauri/bin/');
    console.log('3. Make it executable: chmod +x web/src-tauri/bin/adb');
    console.log('\nFor Windows builds, the Windows ADB should already be in the project root.');

    // Check what's available
    console.log('\nCurrent status:');
    const windowsAdb = join(projectRoot, 'adb.exe');
    const macAdb = join(binDir, 'adb');

    console.log(`Windows ADB (project root): ${existsSync(windowsAdb) ? '✓ Found' : '✗ Not found'}`);
    console.log(`macOS ADB (src-tauri/bin): ${existsSync(macAdb) ? '✓ Found' : '✗ Not found'}`);
}

main().catch(console.error);
