# Syft GUI

A cross-platform desktop application for generating Software Bill of Materials (SBOM) using Syft.

## Prerequisites

1. Node.js (v14 or later)
2. Syft CLI tool installed and accessible from PATH, or placed in the same directory as the app executable
   - For installation instructions, visit: https://github.com/anchore/syft#installation
   - Alternatively, download the Syft binary and place it in the app's directory for portable use

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Development

To run the application in development mode:
```bash
npm install
npm start
```

## Testing

Run tests:
```bash
npm test
```

## Linting

Check code quality:
```bash
npm run lint
```

## Building

To build the application for your platform:
```bash
npm run build
```

This will create platform-specific distributables in the `dist` directory:
- Windows: Portable executable
- macOS: .dmg file
- Linux: .deb package

## Production Readiness

This application includes security hardening with context isolation and a preload script. Before deploying:

1. Ensure all dependencies are up-to-date and vulnerabilities are addressed.
2. Run tests and linting (`npm test`, `npm run lint`).
3. Test the build on target platforms (`npm run build`).
4. Configure proper code signing for releases.
5. CI/CD is set up with GitHub Actions for automated testing on pushes and PRs.

## Usage

1. Launch the application
2. Click "Browse" to select a directory containing the code you want to analyze
3. Choose the desired output format:
   - JSON
   - Text
   - CycloneDX JSON
   - SPDX JSON
4. Click "Generate SBOM" to create the Software Bill of Materials

## Notes

- Make sure Syft is properly installed and accessible from your system's PATH
- The application will automatically detect your operating system and use the appropriate Syft command
- For Windows users, ensure syft.exe is in your PATH
- For Linux/macOS users, ensure syft is in your PATH

## Troubleshooting

If you encounter any issues:

1. Verify Syft is installed correctly by running `syft version` in your terminal
2. Ensure you have proper permissions to access the selected directory
3. Check if the selected directory contains valid source code or artifacts
4. For Windows users, make sure you're using syft.exe