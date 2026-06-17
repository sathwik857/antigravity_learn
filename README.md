# BigQuery Release Notes Dashboard

An interactive, responsive web dashboard built with Python Flask and vanilla HTML/CSS/JavaScript. It fetches Google Cloud's BigQuery release notes in real-time, displays them cleanly, categorizes updates, and integrates a Twitter (X) share composer with character limit verification.

---

## ✨ Features

*   **Real-Time Sync**: Fetches the official Google Cloud BigQuery release feed (`docs.cloud.google.com/feeds/bigquery-release-notes.xml`) via a Python-based API gateway proxy (avoiding browser CORS blocks).
*   **Automatic Tagging**: Client-side categorization parses descriptions and labels updates with status badges:
    *   🟢 `New` (Emerald) - New features and previews.
    *   🔵 `Changed` (Blue) - Behavior modifications.
    *   🟣 `Fixed` (Purple) - Bug resolutions and hotfixes.
    *   🔴 `Deprecated` (Rose) - Deprecations and retired options.
*   **Search & Filter**: Instantly search titles and content or click status pills to filter by categories.
*   **Persistent Theme Toggle**: A sun/moon toggle button in the header that swaps root CSS colors between a slate dark mode and a zinc/indigo light mode, preserving your choice in `localStorage`.
*   **Export to CSV**: A utility button in the header that compiles and downloads a CSV spreadsheet of the *currently visible/filtered* updates.
*   **Copy to Clipboard**:
    *   **Card-Level Copy**: Copies a pre-formatted plain-text preview of the card details (Date, Title, Summary, and URL) without shifting your active view.
    *   **Detail-Level Copy**: Copies the full, plain-text content of the selected update.
*   **Toast Notifications**: Built-in visual alerts showing feedback toasts for successes (copied text, exported CSV), warnings (character overflows), and info states (redirecting to X).
*   **Sliding Mobile View**: Fully responsive layout that splits columns side-by-side on desktops and collapses into a sliding drawer panel on mobile/tablet screens (<900px) with a custom "Back to Feed" controller.
*   **Twitter/X Composer Integration**:
    *   Automatically drafts a tweet with the update title and documentation link.
    *   Dynamically truncates the title to guarantee the total text fits within the **280-character limit**.
    *   Conic-gradient visual indicator ring showing character limits (turns orange at `250+` characters, red at `280+` characters, and disables posting on overflow).
    *   Launches X's Web Intent composer directly to publish your post.

---

## 🛠️ Technology Stack

*   **Backend**: Python 3.9+, Flask
*   **Frontend**: Plain Vanilla HTML5, CSS3 (conic gradients, backdrop blur), ES6 JavaScript
*   **External Assets**: FontAwesome (icons), Google Fonts (`Outfit` & `Plus Jakarta Sans`)

---

## 📁 Repository Structure

```text
bq-releases-notes/
├── .venv/                 # Python local virtual environment
├── static/
│   ├── css/
│   │   └── style.css      # App stylesheet (Gradients, light/dark themes, responsive drawer, toasts)
│   └── js/
│       └── main.js        # Engine (API fetches, classification, tweet validation, copy/csv utilities)
├── templates/
│   └── index.html         # Main dashboard template
├── .gitignore             # Standard project rules for Git ignores
├── app.py                 # Flask server (Parses XML namespace feeds to JSON)
├── README.md              # Project documentation (Updated)
└── requirements.txt       # Python dependency declaration
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Python 3** installed on your system.

### Running the App Locally

1.  **Open your terminal** in the root of the project directory:
    ```bash
    cd C:\Users\sathw\downloads\googlexkaggle_course\agy-cli-projects\bq-releases-notes
    ```

2.  **Activate the Virtual Environment**:
    *   **Windows (PowerShell)**:
        ```powershell
        .\.venv\Scripts\Activate.ps1
        ```
    *   **Windows (Command Prompt)**:
        ```cmd
        .\.venv\Scripts\activate.bat
        ```
    *   **macOS / Linux**:
        ```bash
        source .venv/bin/activate
        ```

3.  **Install Dependencies** (if running on a new machine):
    ```bash
    pip install -r requirements.txt
    ```

4.  **Start the Server**:
    ```bash
    python app.py
    ```

5.  **Open your Browser**:
    Navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)** to view the dashboard!
