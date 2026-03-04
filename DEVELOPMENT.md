# Pokémon MezaHub - Development Guide

This guide breaks down the project architecture, the data processing workflow, and instructions on modifying the project efficiently. 

## Project Architecture

Unlike complex frontend ecosystems, this project relies on a lightweight stack designed for rapid manual updates:
- **`index.html`**: The main Single-Page Application (SPA) view. All the navigation, view states, and template layouts exist here.
- **`/assets/`**: Houses application images, interface logos, and UI-specific static assets.
- **`/css/`**: Dedicated repository for static stylesheets (if extended). Currently, styling primarily operates via Tailwind.
- **`/js/`**: Contains the core logic modules:
  - `app.js`: Main client engine. Controls UI interactions, search filters, state management, modal popups, and dynamically generating HTML elements for grids/lists.
  - `data.js`: Auto-generated database payload. **Do not strictly edit this manually** as it will be overwritten. It feeds structured JSON data to `app.js`.
  - `firebase-db.js`: Contains external connections logic handling data syncing or remote tracking.
- **`/data/`**: Home to the source-of-truth spreadsheet `Updated_PokeTables.xlsx`. 
- **`/scripts/`**: Development environment scripts utilizing python for automation (i.e., data exporting, diagnostics, testing image croppers).
- **`manifest.json` & `sw.js`**: PWA service workers and configuration settings defining caching and offline features.

---

## Data Update Workflow (Adding / Modifying Pokémon)

Pokédex entries, move information, and Battle analytics are primarily driven by the Excel master data. To push new additions into the application, you must follow this lifecycle:

### 1. Update the Excel Database
Open `data/Updated_PokeTables.xlsx` and input your new data adjustments inside the relevant sheets (`Main_Table`, `WeaknessChart`, `Move_List`). Save and close the file.

### 2. Format & Compile Data `(export_data.py)`
To translate Excel sheets into JavaScript models, you should run the parsing builder.

1. Ensure your Python virtual environment is active (the folder `.venv` exists at root).
   ```bash
   # Windows Command
   .venv\Scripts\activate
   ```
2. Verify you have the correct dependencies in the environment (`pandas`, `openpyxl`). 
   ```bash
   pip install pandas openpyxl
   ```
3. Run the export script:
   ```bash
   python scripts/export_data.py
   ```
*This step extracts all information from the Excel tables, normalizes missing attributes, maps Move-Types, and outputs an updated dictionary array string directly to `js/data.js`.*

### 3. Support Validation Utilities
Inside the `/scripts` directory, there are multiple support tools you can use while debugging data faults:
- `crop_qr.py` / `crop_test.py`: Assists in preparing bulk QR code visual assets by reading, formatting, and standardizing their dimensions.
- `check_dim.py` / `check_zmoves.py` / `debug_data.py`: Used for validating edge cases in character logic ensuring that moves, sizing, and formats will properly evaluate in the web frontend.

---

## Modifying UI & Styling

**Tailwind CSS Execution**
Currently, Tailwind CSS utilizes the **CDN compiler script**. 
- **Configuration Context**: To modify custom application colors (`primary`, `surface-dark`, `nav-bg`), edit the JavaScript `<script id="tailwind-config">` located in `index.html` > `<head>`.
- **CSS Overrides**: Any structural style additions bypassing Tailwind utilities (e.g., webkit scrollbar overrides, `.glass-card` animated filters, manual CSS class backgrounds based on type color) live inside the `<style type="text/tailwindcss">` block just below configuration. 

**Component Management (`app.js`)**
Adding new elements to lists (like Battle target views) involves modifying the javascript file. Check the helper rendering functions (like `renderPokedex(list)` or `renderBattleCounters()`) when pushing HTML string updates.

## Future Development Considerations
- **Implement a Bundler (Vite or Webpack)**: Serving Tailwind by the CDN is decent for prototyping but forces the end user to compile styles on load. Establishing a robust bundler will improve web vitals entirely by pre-compiling CSS classes.
- **Component Componentization**: Should the size of `index.html` and `app.js` become bloated and difficult to maintain, migrating logic over to **React** or **Vue** is highly recommended to isolate components (ex. `<PokedexGrid>`, `<BattleAssistant>`).
