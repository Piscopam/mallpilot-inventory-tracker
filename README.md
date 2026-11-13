# MallPilot - Shopping Mall Inventory Tracker

A clean, modern, and minimalist SaaS inventory management dashboard for shopping malls and retail outlets. Built with pure HTML, CSS, and vanilla JavaScript with zero dependencies and no backend required.

All inventory records are stored directly in the browser via `localStorage` and persist automatically across page reloads.

---

## 🌟 Key Features

- **Full Inventory CRUD**: Add, edit, view, and delete mall items with real-time browser storage sync.
- **Adaptive Responsive Design**:
  - **Desktop / Tablet**: Expansive data table with sorting, tags, and status columns.
  - **Mobile / Phone**: Responsive vertical card view with zero horizontal scrolling and thumb-friendly touch targets.
- **Low-Stock Automation**: Items with quantities below **10 units** trigger high-visibility amber warning badges and are tracked on the top alert metric card.
- **Search & Multi-Filter**:
  - Instant live search matching item names, categories, or aisle locations.
  - Category filter dropdown and dynamic sidebar category list.
  - Stock-level filter (All, Normal Stock, Low Stock `< 10`).
  - Active filter chips bar with one-click removal.
- **Delete Confirmation Dialog**: Modal review displaying item details to prevent accidental removals.
- **CSV Data Export**: One-click download of all inventory records as a formatted `.csv` file for auditing and reporting.
- **Non-Intrusive Notifications**: Toast alerts for success, warnings, and field validation errors.
- **Minimalist SaaS Aesthetic**: Solid white and light grey backgrounds, dark navy typography, subtle enterprise green accents, and zero gradients.

---

## 📁 Project Structure

```text
├── index.html       # Clean semantic dashboard layout, modals, and sidebar
├── style.css        # Minimalist SaaS CSS design tokens, layout & responsive rules
├── script.js        # Vanilla JS state management, localStorage CRUD & filter engine
└── README.md        # Project documentation
```

---

## 🚀 Getting Started

No build step, Node.js server, or package installation is required:

1. Clone or download this repository.
2. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
3. The dashboard will automatically launch preloaded with sample mall inventory items (or click **Reset Mall Demo Data** in the sidebar at any time).

---

## 📄 License

MIT License. Open for personal and commercial inventory management.
