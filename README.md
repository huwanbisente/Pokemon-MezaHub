<h1 align="center">Pokémon MezaHub</h1>

<p align="center">
  A Progressive Web App designed as a companion tool for tracking Pokédex entries, analyzing battle weaknesses, and managing Support QR codes for the Arcade Machine.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Author-Jan%20Vincent%20Chioco-red?style=flat-square" alt="Author">
  <img src="https://img.shields.io/badge/Frontend-Vanilla%20JS%20%2B%20TailwindCSS-green?style=flat-square" alt="Frontend">
  <img src="https://img.shields.io/badge/Backend-Firebase-blue?style=flat-square&logo=firebase&logoColor=white" alt="Backend">
  <img src="https://img.shields.io/badge/Data-Python%20%2B%20Excel-purple?style=flat-square" alt="Data">
</p>

---

*   If you find this tool useful for managing your Pokémon arcade experience, please consider giving it a star!

**Pokémon MezaHub** is a web application designed as a companion tool for tracking Pokédex entries, analyzing battle weaknesses, and managing Support QR codes for the Arcade Machine. It functions as a Progressive Web App (PWA) that can be accessed via a desktop browser or seamlessly installed on mobile devices for an app-like experience.

The project uses a lightweight stack designed for rapid manual updates, utilizing standard HTML, CSS via Tailwind CDN, and Vanilla JavaScript, with data processed from an Excel master database using Python scripts.

---

## System Architecture

The following diagram illustrates the complete system architecture and data flow:

**Key Components:**
- **Frontend SPA**: Main single-page application served via `index.html` with Vanilla JavaScript (`app.js`).
- **Data Engine**: Python scripts extract and format data from `Updated_PokeTables.xlsx` into the application's `data.js`.
- **Styling Architecture**: Tailwind CSS compiled via CDN, with custom overrides in the main view.
- **PWA Service & Networking**: Uses `manifest.json` and a Service Worker (`sw.js`) for caching and offline capabilities.
- **Backend Syncing**: Firebase integration (`firebase-db.js`) handling data syncing and remote tracking.

---

## User Interface

The application features a responsive, mobile-first dark-themed interface mirroring modern Pokédex designs.

### National Dex & Entry Viewer
Browse, search, and view detailed stats, variants, and weaknesses for various Pokémon entries.
*(Screenshots to be added)*

### Battle Assistant & QR Management
Analyze opponent weaknesses, find top counters, and efficiently present your support QR codes for swift scanning.
*(Screenshots to be added)*

---

## Features

*   **Progressive Web App (PWA)**: Installable on mobile devices (iOS/Android) and desktop browsers for offline, native-like access.
*   **National Dex**: Browse, search, and filter detailed stats, variants, and weaknesses.
*   **Battle Assistant**: Analyze opponent weaknesses, find top counters, and select Pokémon tags based on stats, star rating, and type efficiency.
*   **Support QR Scanner**: Manage and present your support QR codes efficiently for swift scanning at the arcades.
*   **Trainer Profile**: Track overall progress, check battle history statistics, and customize your trainer avatar alongside a companion Pokémon.
*   **Data Driven System**: Pokédex entries and battle analytics are primarily driven by an Excel master data table synced via Python tooling.

## Requirements

*   A modern web browser (Google Chrome, Safari, Microsoft Edge, Mozilla Firefox)
*   Python 3.10+ (For updating datasets via Excel)
*   `pandas` and `openpyxl` Python libraries

## Installation & Setup

Because the application is built using standard HTML, CSS, and Vanilla JavaScript leveraging the Tailwind CSS compiler via CDN, it does not require a complex build process, package managers, or bundlers.

**Method 1 (Local Server):**

Clone the repository:

```bash
git clone https://github.com/huwanbisente/Pokemon-MezaHub.git
cd Pokemon-MezaHub
```

Start the server using Python:

```bash
python -m http.server 8000
```
Then open your web browser and navigate to: `http://localhost:8000`

**Method 2 (VS Code Live Server):**
1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension.
3. Right-click on `index.html` and select **"Open with Live Server"**.

## Data Update Workflow

Pokédex entries, move information, and Battle analytics are primarily driven by the Excel master data. To push new additions:

1.  **Update the Excel Database**: Edit `data/Updated_PokeTables.xlsx` inside the relevant sheets.
2.  **Format & Compile Data**:
    ```bash
    # Activate virtual environment
    .venv\Scripts\activate
    
    # Run the export script
    python scripts/export_data.py
    ```

## Project Structure

```text
├── assets/                 # Application images, interface logos, assets
├── css/                    # Static stylesheets
├── data/                   # Source-of-truth spreadsheet (Updated_PokeTables.xlsx)
├── js/                     
│   ├── app.js              # Main client engine (UI, state, filters)
│   ├── data.js             # Auto-generated database payload
│   └── firebase-db.js      # External connection logic
├── scripts/                # Python dev tools (export_data.py, crop_qr.py, etc.)
├── index.html              # Main SPA view
├── manifest.json           # PWA configuration
├── sw.js                   # Service Worker for offline support
└── DEVELOPMENT.md          # Full Developer Documentation
```
