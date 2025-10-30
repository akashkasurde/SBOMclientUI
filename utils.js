const path = require('path');
const fs = require('fs').promises;

// Add function to get org code marker path
function getOrgCodeMarkerPath() {
    const rootDir = process.platform === 'win32' ? 'C:\\Users\\Public\\Documents' : '/var/tmp';
    return path.join(rootDir, '.org_code');
}

// Add function to save org code
async function saveOrgCode(orgCode) {
    const markerPath = getOrgCodeMarkerPath();
    await fs.writeFile(markerPath, orgCode);
}

// Add function to get org code
async function getOrgCode() {
    try {
        const markerPath = getOrgCodeMarkerPath();
        const orgCode = await fs.readFile(markerPath, 'utf8');
        return orgCode.trim();
    } catch {
        return null;
    }
}

module.exports = {
    getOrgCodeMarkerPath,
    saveOrgCode,
    getOrgCode
};