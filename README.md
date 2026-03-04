# Pokémon MezaHub

Pokémon MezaHub is a web application designed as a companion tool for tracking Pokédex entries, analyzing battle weaknesses, and managing Support QR codes for the Arcade Machine. It functions as a Progressive Web App (PWA) that can be accessed via a desktop browser or seamlessly installed on mobile devices for an app-like experience.

## Core Features
1. **National Dex**: Browse, search, and view detailed stats, variants, and weaknesses for various Pokémon entries.
2. **Battle Assistant**: Analyze opponent weaknesses, find top counters, and select Pokémon tags based on stats, star rating, and type efficiency.
3. **Support QR Scanner**: Manage and present your support QR codes efficiently for swift scanning at the arcades.
4. **Trainer Profile**: Track overall progress, check battle history statistics, and customize your trainer avatar alongside a companion Pokémon.

---

## Setup & Operation Guide

### 1. Requirements
- A modern web browser (Google Chrome, Safari, Microsoft Edge, Mozilla Firefox).
- For local development and operation: Any preferred local web server (e.g., VS Code *Live Server* extension, or Python's built-in `http.server`).

### 2. Running the App Locally
Because the application is built using standard HTML, CSS, and Vanilla JavaScript leveraging the Tailwind CSS compiler via CDN, it does not require a complex build process, package managers, or bundlers to run.

You can launch it easily using one of these methods:

**Method A (VS Code - Recommended)**: 
1. Open the project folder (`Project_PokemonV3`) in Visual Studio Code.
2. Go to the Extensions tab and ensure **Live Server** is installed.
3. Right-click on `index.html` in your file explorer.
4. Select **"Open with Live Server"**. A browser window will automatically launch the app.

**Method B (Python)**:
1. Open your terminal or Command Prompt.
2. Navigate to the root directory of the project.
3. Start the server using the command: `python -m http.server` (or `python3 -m http.server`).
4. Open your web browser and navigate to: `http://localhost:8000`.

### 3. Installing as an Offline App (PWA)
This project is configured as a Progressive Web App (powered by `manifest.json` and `sw.js`). You can "install" it to act like native software.

1. Ensure the app is being served over HTTPS or localhost.
2. Open the application link on your mobile phone or use a compatible desktop browser.
3. On your browser options menu, select **"Add to Home Screen"** (iOS Safari / Chrome Android) or click the **"Install App"** icon in the address bar (Desktop Chrome/Edge).
4. You can now launch Pokémon MezaHub directly from your applications menu or home screen!
