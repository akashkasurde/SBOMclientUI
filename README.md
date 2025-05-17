# Syft GUI

A cross-platform desktop application for generating Software Bill of Materials (SBOM) using Syft.

## Prerequisites

1. Node.js (v14 or later)
2. Syft CLI tool installed and accessible from PATH
   - For installation instructions, visit: https://github.com/anchore/syft#installation

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Development

To run the application in development mode:
```bash
npm start
```

## Building

To build the application for your platform:
```bash
npm run build
```

This will create platform-specific distributables in the `dist` directory:
- Windows: NSIS installer (.exe)
- macOS: .dmg file
- Linux: AppImage

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