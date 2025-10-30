const { getOrgCodeMarkerPath } = require('../utils');
const path = require('path');

describe('Utils', () => {
  describe('getOrgCodeMarkerPath', () => {
    test('should return correct path on Windows', () => {
      // Mock process.platform
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      const expectedPath = path.join('C:\\Users\\Public\\Documents', '.org_code');
      expect(getOrgCodeMarkerPath()).toBe(expectedPath);

      // Restore
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    test('should return correct path on Unix-like systems', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      const expectedPath = path.join('/var/tmp', '.org_code');
      expect(getOrgCodeMarkerPath()).toBe(expectedPath);

      // Restore
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });
  });
});