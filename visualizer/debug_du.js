const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getScribeFolder() {
    const envPath = path.join(process.cwd(), "..", ".env");
    console.log("Checking env path:", envPath);
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/SCRIBE_FOLDER="([^"]+)"/);
        if (match) {
            console.log("Found SCRIBE_FOLDER in .env:", match[1]);
            return match[1];
        }
    }

    
    const fallback = path.join(process.cwd(), "..", "outputs-dev");
    console.log("Checking fallback:", fallback);
    if (fs.existsSync(fallback)) {
        console.log("Fallback exists");
        return fallback;
    }
    return "";
}

function getDirectorySizes(baseFolder) {
    console.log("Running du on:", baseFolder);
    const sizes = new Map();
    try {
        const output = execSync(`du -d 1 -k "${baseFolder}"`, { encoding: 'utf-8' });
        console.log("DU Output snippet:", output.slice(0, 200));
        const lines = output.split('\n');

        for (const line of lines) {
            const match = line.trim().match(/^(\d+)\s+(.+)$/);
            if (match) {
                const sizeKB = parseInt(match[1], 10);
                const fullPath = match[2];
                const folderName = path.basename(fullPath);
                console.log(`Found: ${folderName} -> ${sizeKB} KB`);
                if (folderName && folderName !== "." && folderName !== "..") {
                    sizes.set(folderName, sizeKB * 1024);
                }
            }
        }
    } catch (e) {
        console.error("Failed to calculate directory sizes:", e);
    }
    return sizes;
}

const folder = getScribeFolder();
if (folder) {
    const sizes = getDirectorySizes(folder);
    console.log("Sizes map:", sizes);
} else {
    console.log("No folder found");
}
