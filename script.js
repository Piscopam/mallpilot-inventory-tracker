/**
 * MallPilot - Shopping Mall Inventory Tracker
 * Pure Vanilla JavaScript Implementation
 * 
 * Features:
 * - Full CRUD (Create, Read, Update, Delete) with localStorage persistence
 * - Real-time search across item names, categories, and mall locations
 * - Category, Stock-level, and Sort filters with active chip indicators
 * - Low-stock automated detection & warnings (quantity < 10)
 * - Input validation preventing negative numbers and blank required fields
 * - Custom delete confirmation modal with item context preview
 * - Toast notification feedback system
 * - CSV Export for mall inventory auditing
 * - Fully responsive with mobile sidebar drawer
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Constants and State Management
  // ==========================================================================

  const STORAGE_KEY = 'mallpilot_nigerian_inventory_v1';
  const LOW_STOCK_THRESHOLD = 10;

  // Simple, realistic everyday goods found in a typical Nigerian mall (e.g. Shoprite / Spar)
  const SAMPLE_ITEMS = [
    {
      id: 'MAL-1001',
      name: 'Television (Smart LED 43-inch)',
      category: 'Electronics & Appliances',
      quantity: 15,
      unit: 'units',
      location: 'Floor 1 • Electronics Wing • Shelf E-04',
      createdAt: '2026-11-10T09:30:00.000Z'
    },
    {
      id: 'MAL-1002',
      name: 'Blender with Grinder Mill (1.5L)',
      category: 'Home & Kitchen',
      quantity: 7, // Low stock (< 10)
      unit: 'pcs',
      location: 'Floor 1 • Kitchen Appliances • Aisle 2',
      createdAt: '2026-11-10T10:15:00.000Z'
    },
    {
      id: 'MAL-1003',
      name: 'Full-Body Female Display Mannequin',
      category: 'Fashion & Clothing',
      quantity: 4, // Low stock (< 10)
      unit: 'pcs',
      location: 'Floor 2 • Boutique Section • Store 18',
      createdAt: '2026-11-11T08:00:00.000Z'
    },
    {
      id: 'MAL-1004',
      name: 'Cowbell Chocolate Powder (400g Refill)',
      category: 'Groceries & Provisions',
      quantity: 140,
      unit: 'packs',
      location: 'Ground Floor • Provisions Aisle 3',
      createdAt: '2026-11-11T11:45:00.000Z'
    },
    {
      id: 'MAL-1005',
      name: 'Cussons Baby Oil Mild & Gentle (200ml)',
      category: 'Baby & Kids',
      quantity: 50,
      unit: 'bottles',
      location: 'Ground Floor • Baby Care Section • Shelf B-05',
      createdAt: '2026-11-12T14:20:00.000Z'
    },
    {
      id: 'MAL-1006',
      name: 'Dove Beauty Cream Soap Bar (100g)',
      category: 'Health & Beauty',
      quantity: 85,
      unit: 'packs',
      location: 'Ground Floor • Toiletries & Bath • Aisle 6',
      createdAt: '2026-11-12T16:00:00.000Z'
    },
    {
      id: 'MAL-1007',
      name: 'Indomie Instant Noodles (Onion Chicken, 40-Pack)',
      category: 'Groceries & Provisions',
      quantity: 210,
      unit: 'cartons',
      location: 'Ground Floor • Bulk Food Stockroom',
      createdAt: '2026-11-13T07:15:00.000Z'
    },
    {
      id: 'MAL-1008',
      name: 'Rechargeable Standing Fan with Remote (16-inch)',
      category: 'Electronics & Appliances',
      quantity: 6, // Low stock (< 10)
      unit: 'units',
      location: 'Floor 1 • Home Appliances • Shelf E-08',
      createdAt: '2026-11-13T07:45:00.000Z'
    },
    {
      id: 'MAL-1009',
      name: 'Nestle Milo Energy Food Drink (800g Refill)',
      category: 'Groceries & Provisions',
      quantity: 95,
      unit: 'packs',
      location: 'Ground Floor • Provisions Aisle 3',
      createdAt: '2026-11-13T08:00:00.000Z'
    },
    {
      id: 'MAL-1010',
      name: 'Peak Evaporated Full Cream Milk (158g)',
      category: 'Groceries & Provisions',
      quantity: 180,
      unit: 'cartons',
      location: 'Ground Floor • Dairy & Canned Foods • Aisle 4',
      createdAt: '2026-11-13T08:15:00.000Z'
    }
  ];

  // Application State
  const state = {
    items: [],
    searchQuery: '',
    selectedCategory: 'all',
    selectedStatus: 'all', // 'all' | 'low' | 'normal'
    sortBy: 'name-asc',    // 'name-asc' | 'name-desc' | 'qty-asc' | 'qty-desc' | 'newest'
    itemToDelete: null,
    editingItemId: null
  };

  // ==========================================================================
  // 2. DOM Elements Cache
  // ==========================================================================

  const dom = {
    // Navigation & Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop'),
    menuToggleBtn: document.getElementById('menu-toggle-btn'),
    mobileCloseBtn: document.getElementById('mobile-close-btn'),
    navAllItems: document.getElementById('nav-all-items'),
    navLowStock: document.getElementById('nav-low-stock'),
    navTotalBadge: document.getElementById('nav-total-badge'),
    navLowStockBadge: document.getElementById('nav-low-stock-badge'),
    sidebarCategoriesList: document.getElementById('sidebar-categories-list'),
    btnSeedData: document.getElementById('btn-seed-data'),

    // Top Stats
    statTotalItems: document.getElementById('stat-total-items'),
    statLowStockCount: document.getElementById('stat-low-stock-count'),
    statCardLowStock: document.getElementById('stat-card-low-stock'),
    statTotalUnits: document.getElementById('stat-total-units'),
    statCategoriesCount: document.getElementById('stat-categories-count'),

    // Search and Filters
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    categoryFilter: document.getElementById('category-filter'),
    statusFilter: document.getElementById('status-filter'),
    sortFilter: document.getElementById('sort-filter'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    activeFiltersBar: document.getElementById('active-filters-bar'),
    filterChipsList: document.getElementById('filter-chips-list'),
    btnClearAllFilters: document.getElementById('btn-clear-all-filters'),

    // Table & Results
    resultsCount: document.getElementById('results-count'),
    tableWrapper: document.getElementById('table-wrapper'),
    mobileCardsWrapper: document.getElementById('mobile-cards-wrapper'),
    inventoryTbody: document.getElementById('inventory-tbody'),
    btnExportCsv: document.getElementById('btn-export-csv'),

    // Empty State
    emptyState: document.getElementById('empty-state'),
    emptyStateTitle: document.getElementById('empty-state-title'),
    emptyStateText: document.getElementById('empty-state-text'),
    emptyStateActions: document.getElementById('empty-state-actions'),
    emptyAddBtn: document.getElementById('empty-add-btn'),
    emptySeedBtn: document.getElementById('empty-seed-btn'),

    // Add / Edit Modal
    itemModal: document.getElementById('item-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalHeaderIcon: document.getElementById('modal-header-icon'),
    modalSubmitLabel: document.getElementById('modal-submit-label'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    openAddModalBtn: document.getElementById('open-add-modal-btn'),
    itemForm: document.getElementById('item-form'),

    // Form Fields
    formItemId: document.getElementById('form-item-id'),
    formItemName: document.getElementById('form-item-name'),
    formItemCategory: document.getElementById('form-item-category'),
    formItemCustomCategory: document.getElementById('form-item-custom-category'),
    formItemLocation: document.getElementById('form-item-location'),
    formItemQuantity: document.getElementById('form-item-quantity'),
    formItemUnit: document.getElementById('form-item-unit'),
    formItemCustomUnit: document.getElementById('form-item-custom-unit'),

    // Form Field Errors
    errorItemName: document.getElementById('error-item-name'),
    errorItemCategory: document.getElementById('error-item-category'),
    errorItemLocation: document.getElementById('error-item-location'),
    errorItemQuantity: document.getElementById('error-item-quantity'),
    errorItemUnit: document.getElementById('error-item-unit'),

    // Delete Confirmation Modal
    deleteModal: document.getElementById('delete-modal'),
    deleteModalCloseBtn: document.getElementById('delete-modal-close-btn'),
    deleteCancelBtn: document.getElementById('delete-cancel-btn'),
    deleteConfirmBtn: document.getElementById('delete-confirm-btn'),
    deleteItemName: document.getElementById('delete-item-name'),
    deleteItemCategory: document.getElementById('delete-item-category'),
    deleteItemLocation: document.getElementById('delete-item-location'),
    deleteItemQty: document.getElementById('delete-item-qty'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================================================
  // 3. Storage Functions
  // ==========================================================================

  /**
   * Load items from localStorage.
   * If first time running (key doesn't exist), seed with initial sample data.
   */
  function loadItemsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        // Initial setup for shopping mall
        state.items = [...SAMPLE_ITEMS];
        saveItemsToStorage();
      } else {
        state.items = JSON.parse(stored) || [];
      }
    } catch (err) {
      console.error('Failed to parse localStorage data:', err);
      showToast('Storage Notice', 'Could not load saved data. Starting with default mall items.', 'warning');
      state.items = [...SAMPLE_ITEMS];
    }
  }

  /**
   * Persist current items to localStorage.
   */
  function saveItemsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      showToast('Storage Error', 'Browser storage is full or disabled. Changes may not persist.', 'error');
    }
  }

  // ==========================================================================
  // 4. Notification / Toast System
  // ==========================================================================

  /**
   * Display a clean, non-intrusive toast notification.
   * @param {string} title - Short title for the toast
   * @param {string} message - Informative description
   * @param {'success'|'error'|'warning'|'info'} type - Toast type
   */
  function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-octagon';
    else if (type === 'warning') iconName = 'alert-triangle';
    else if (type === 'info') iconName = 'info';

    toast.innerHTML = `
      <i data-lucide="${iconName}" class="toast-icon"></i>
      <div class="toast-content">
        <span class="toast-title">${escapeHTML(title)}</span>
        <span class="toast-message">${escapeHTML(message)}</span>
      </div>
      <button class="toast-close-btn" aria-label="Close notification">
        <i data-lucide="x"></i>
      </button>
    `;

    dom.toastContainer.appendChild(toast);
    refreshIcons();

    // Close button handler
    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => dismissToast(toast));

    // Auto dismiss after 3.5 seconds
    const timer = setTimeout(() => dismissToast(toast), 3500);
    toast._timer = timer;
  }

  function dismissToast(toast) {
    if (!toast || toast._dismissed) return;
    toast._dismissed = true;
    if (toast._timer) clearTimeout(toast._timer);
    toast.classList.add('toast-fadeout');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }

  // ==========================================================================
  // 5. Icons Refresh Helper (Lucide CDN + Resilient Offline Fallback)
  // ==========================================================================

  const SVG_ICONS = {
    'store': '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>',
    'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    'building-2': '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    'boxes': '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l6 3.43a2 2 0 0 0 2.06 0l6-3.43a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71l-6-3.43a2 2 0 0 0-2.06 0l-6 3.43Z"/><path d="m17 13 4.2-2.4a2 2 0 0 0 1-1.73V5.63a2 2 0 0 0-1-1.73L15.2 0.47a2 2 0 0 0-2.06 0L9 2.87"/><path d="m7 13-4.2-2.4A2 2 0 0 1 1.8 8.87V5.63a2 2 0 0 1 1-1.73L8.8 0.47a2 2 0 0 1 2.06 0L17 4"/><path d="M7 17.5v-5"/><path d="M17 17.5v-5"/>',
    'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    'menu': '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'package': '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    'layers': '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    'tags': '<path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.2 18.2a2.4 2.4 0 0 0 3.4 0l3.6-3.6a2.4 2.4 0 0 0 0-3.4Z"/><circle cx="6.5" cy="8.5" r=".5" fill="currentColor"/>',
    'tag': '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    'package-search': '<path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/><circle cx="18.5" cy="15.5" r="2.5"/><path d="M20.27 17.27 22 19"/>',
    'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    'package-plus': '<path d="M16 16h6"/><path d="M19 13v6"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>',
    'pencil': '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    'check': '<polyline points="20 6 9 17 4 12"/>',
    'trash-2': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    'check-circle-2': '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
    'alert-octagon': '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    'folder': '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>'
  };

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
      return;
    }

    // Resilient inline SVG fallback for all elements with data-lucide
    document.querySelectorAll('[data-lucide]').forEach(el => {
      const name = el.getAttribute('data-lucide');
      if (SVG_ICONS[name]) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.innerHTML = SVG_ICONS[name];
        
        // Preserve any classes or attributes
        if (el.className) svg.setAttribute('class', el.className);
        el.parentNode.replaceChild(svg, el);
      }
    });
  }

  // ==========================================================================
  // 6. Security and Utility Helpers
  // ==========================================================================

  /**
   * Escape user string for safe HTML injection
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Generate clean SKU/ID for mall item
   */
  function generateSKU() {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `MAL-${rand}`;
  }

  /**
   * Format numbers with commas (e.g., 1,250)
   */
  function formatNumber(num) {
    return Number(num).toLocaleString('en-US');
  }

  // ==========================================================================
  // 7. Filtering, Searching and Sorting Pipeline
  // ==========================================================================

  /**
   * Get filtered, searched, and sorted list of items.
   */
  function getProcessedItems() {
    let result = [...state.items];

    // 1. Search Query Filter (Matches Item Name, Category, or Mall Location)
    const query = state.searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const catMatch = item.category.toLowerCase().includes(query);
        const locMatch = (item.location || '').toLowerCase().includes(query);
        return nameMatch || catMatch || locMatch;
      });
    }

    // 2. Category Filter
    if (state.selectedCategory !== 'all') {
      result = result.filter(item => 
        item.category.toLowerCase() === state.selectedCategory.toLowerCase()
      );
    }

    // 3. Stock Status Filter
    if (state.selectedStatus === 'low') {
      result = result.filter(item => Number(item.quantity) < LOW_STOCK_THRESHOLD);
    } else if (state.selectedStatus === 'normal') {
      result = result.filter(item => Number(item.quantity) >= LOW_STOCK_THRESHOLD);
    }

    // 4. Sorting
    result.sort((a, b) => {
      switch (state.sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        case 'name-desc':
          return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
        case 'qty-asc':
          return Number(a.quantity) - Number(b.quantity);
        case 'qty-desc':
          return Number(b.quantity) - Number(a.quantity);
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

    return result;
  }

  // ==========================================================================
  // 8. Render Engine
  // ==========================================================================

  /**
   * Master render method: updates statistics, category dropdowns,
   * active filters, and the data table / empty states.
   */
  function render() {
    renderStats();
    renderCategoryDropdown();
    renderSidebarCategories();
    renderActiveFilterChips();
    renderInventoryTable();
    refreshIcons();
  }

  /**
   * Render top statistic summary cards and sidebar badges
   */
  function renderStats() {
    const totalItems = state.items.length;
    const lowStockItems = state.items.filter(item => Number(item.quantity) < LOW_STOCK_THRESHOLD).length;
    const totalUnits = state.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const categoriesSet = new Set(state.items.map(item => item.category.trim()));

    // Update Top Stat Cards
    dom.statTotalItems.textContent = formatNumber(totalItems);
    dom.statLowStockCount.textContent = formatNumber(lowStockItems);
    dom.statTotalUnits.textContent = formatNumber(totalUnits);
    dom.statCategoriesCount.textContent = formatNumber(categoriesSet.size);

    // Update Sidebar Navigation Badges
    dom.navTotalBadge.textContent = formatNumber(totalItems);
    dom.navLowStockBadge.textContent = formatNumber(lowStockItems);

    // Sidebar highlight sync
    if (state.selectedStatus === 'low') {
      dom.navLowStock.classList.add('active');
      dom.navAllItems.classList.remove('active');
    } else if (state.selectedCategory === 'all' && state.selectedStatus === 'all') {
      dom.navAllItems.classList.add('active');
      dom.navLowStock.classList.remove('active');
    } else {
      dom.navAllItems.classList.remove('active');
      dom.navLowStock.classList.remove('active');
    }
  }

  /**
   * Re-populate category select filter with available unique categories
   */
  function renderCategoryDropdown() {
    const categories = Array.from(new Set(state.items.map(i => i.category.trim()))).sort();

    let html = `<option value="all">All Categories</option>`;
    categories.forEach(cat => {
      const selected = (state.selectedCategory.toLowerCase() === cat.toLowerCase()) ? 'selected' : '';
      html += `<option value="${escapeHTML(cat)}" ${selected}>${escapeHTML(cat)}</option>`;
    });

    dom.categoryFilter.innerHTML = html;
  }

  /**
   * Render category quick links in sidebar
   */
  function renderSidebarCategories() {
    const categories = Array.from(new Set(state.items.map(i => i.category.trim()))).sort();
    
    if (categories.length === 0) {
      dom.sidebarCategoriesList.innerHTML = `<li class="nav-section-label" style="text-transform:none; font-weight:normal;">No categories</li>`;
      return;
    }

    let html = '';
    categories.forEach(cat => {
      const count = state.items.filter(i => i.category.trim() === cat).length;
      const isActive = state.selectedCategory.toLowerCase() === cat.toLowerCase();
      html += `
        <li class="nav-item">
          <button class="nav-link ${isActive ? 'active' : ''}" data-cat="${escapeHTML(cat)}">
            <i data-lucide="folder"></i>
            <span>${escapeHTML(cat)}</span>
            <span class="nav-badge">${count}</span>
          </button>
        </li>
      `;
    });

    dom.sidebarCategoriesList.innerHTML = html;

    // Attach click handlers to dynamic sidebar categories
    dom.sidebarCategoriesList.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetCat = btn.getAttribute('data-cat');
        state.selectedCategory = targetCat;
        state.selectedStatus = 'all';
        dom.categoryFilter.value = targetCat;
        dom.statusFilter.value = 'all';
        closeMobileSidebar();
        render();
      });
    });
  }

  /**
   * Render active filter chips below controls bar
   */
  function renderActiveFilterChips() {
    const hasSearch = state.searchQuery.trim().length > 0;
    const hasCategory = state.selectedCategory !== 'all';
    const hasStatus = state.selectedStatus !== 'all';

    dom.clearSearchBtn.classList.toggle('hidden', !hasSearch);

    if (!hasSearch && !hasCategory && !hasStatus) {
      dom.activeFiltersBar.classList.add('hidden');
      dom.filterChipsList.innerHTML = '';
      return;
    }

    dom.activeFiltersBar.classList.remove('hidden');
    let chipsHtml = '';

    if (hasSearch) {
      chipsHtml += `
        <span class="filter-chip">
          Search: "${escapeHTML(state.searchQuery)}"
          <span class="filter-chip-remove" data-remove="search" title="Remove search filter">
            <i data-lucide="x"></i>
          </span>
        </span>
      `;
    }

    if (hasCategory) {
      chipsHtml += `
        <span class="filter-chip">
          Category: ${escapeHTML(state.selectedCategory)}
          <span class="filter-chip-remove" data-remove="category" title="Remove category filter">
            <i data-lucide="x"></i>
          </span>
        </span>
      `;
    }

    if (hasStatus) {
      const statusLabel = state.selectedStatus === 'low' ? 'Low Stock (< 10)' : 'Normal Stock (>= 10)';
      chipsHtml += `
        <span class="filter-chip">
          Status: ${statusLabel}
          <span class="filter-chip-remove" data-remove="status" title="Remove status filter">
            <i data-lucide="x"></i>
          </span>
        </span>
      `;
    }

    dom.filterChipsList.innerHTML = chipsHtml;

    // Add remove chip handlers
    dom.filterChipsList.querySelectorAll('.filter-chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const removeType = btn.getAttribute('data-remove');
        if (removeType === 'search') {
          state.searchQuery = '';
          dom.searchInput.value = '';
        } else if (removeType === 'category') {
          state.selectedCategory = 'all';
          dom.categoryFilter.value = 'all';
        } else if (removeType === 'status') {
          state.selectedStatus = 'all';
          dom.statusFilter.value = 'all';
        }
        render();
      });
    });
  }

  /**
   * Render main inventory data table or friendly empty states
   */
  function renderInventoryTable() {
    const processedItems = getProcessedItems();
    const totalRecords = state.items.length;
    const shownCount = processedItems.length;

    dom.resultsCount.textContent = `Showing ${shownCount} of ${totalRecords} item${totalRecords === 1 ? '' : 's'}`;

    // Condition 1: Entire inventory is empty
    if (totalRecords === 0) {
      dom.tableWrapper.classList.add('hidden');
      if (dom.mobileCardsWrapper) dom.mobileCardsWrapper.classList.add('hidden');
      dom.emptyState.classList.remove('hidden');
      dom.emptyStateTitle.textContent = 'Your mall inventory is empty';
      dom.emptyStateText.textContent = 'No mall supplies or store inventory records are stored. Add your first item or load sample mall data.';
      dom.emptyStateActions.innerHTML = `
        <button class="btn btn-primary" id="btn-empty-add">
          <i data-lucide="plus"></i>
          <span>Add First Item</span>
        </button>
        <button class="btn btn-outline" id="btn-empty-seed">
          <i data-lucide="refresh-cw"></i>
          <span>Load Sample Mall Data</span>
        </button>
      `;
      // Attach listeners for empty state action buttons
      document.getElementById('btn-empty-add')?.addEventListener('click', openAddModal);
      document.getElementById('btn-empty-seed')?.addEventListener('click', handleSeedData);
      return;
    }

    // Condition 2: Filter/Search results are empty
    if (shownCount === 0) {
      dom.tableWrapper.classList.add('hidden');
      if (dom.mobileCardsWrapper) dom.mobileCardsWrapper.classList.add('hidden');
      dom.emptyState.classList.remove('hidden');
      dom.emptyStateTitle.textContent = 'No matching mall items found';
      dom.emptyStateText.textContent = 'No records matched your active search query or category filter. Try clearing or adjusting your parameters.';
      dom.emptyStateActions.innerHTML = `
        <button class="btn btn-outline" id="btn-empty-reset">
          <i data-lucide="rotate-ccw"></i>
          <span>Reset Search & Filters</span>
        </button>
      `;
      document.getElementById('btn-empty-reset')?.addEventListener('click', resetAllFilters);
      return;
    }

    // Condition 3: Records exist to display in table & mobile cards
    dom.emptyState.classList.add('hidden');
    dom.tableWrapper.classList.remove('hidden');
    if (dom.mobileCardsWrapper) dom.mobileCardsWrapper.classList.remove('hidden');

    let rowsHtml = '';
    let cardsHtml = '';

    processedItems.forEach(item => {
      const isLowStock = Number(item.quantity) < LOW_STOCK_THRESHOLD;
      const rowClass = isLowStock ? 'row-low-stock' : '';

      const statusBadge = isLowStock
        ? `<span class="status-badge status-low" title="Quantity is below 10 units threshold">
             <i data-lucide="alert-triangle"></i>
             <span>Low Stock (&lt; 10)</span>
           </span>`
        : `<span class="status-badge status-normal" title="Stock level is sufficient">
             <i data-lucide="check-circle-2"></i>
             <span>In Stock</span>
           </span>`;

      // 1. Desktop Table Row
      rowsHtml += `
        <tr class="${rowClass}">
          <td>
            <div class="item-cell">
              <span class="item-name">${escapeHTML(item.name)}</span>
              <span class="item-id">${escapeHTML(item.id || 'MAL-0000')}</span>
            </div>
          </td>
          <td>
            <span class="category-tag">
              <i data-lucide="tag"></i>
              ${escapeHTML(item.category)}
            </span>
          </td>
          <td>
            <div class="location-badge">
              <i data-lucide="map-pin"></i>
              <span>${escapeHTML(item.location || 'Unassigned')}</span>
            </div>
          </td>
          <td class="text-right">
            <span class="quantity-value ${isLowStock ? 'warning' : ''}">
              ${formatNumber(item.quantity)}
            </span>
          </td>
          <td>
            <span class="unit-cell">${escapeHTML(item.unit)}</span>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td class="text-right">
            <div class="action-buttons-group">
              <button 
                class="btn-icon btn-edit" 
                data-id="${escapeHTML(item.id)}" 
                title="Edit item ${escapeHTML(item.name)}" 
                aria-label="Edit item ${escapeHTML(item.name)}"
              >
                <i data-lucide="pencil"></i>
              </button>
              <button 
                class="btn-icon btn-icon-danger btn-delete" 
                data-id="${escapeHTML(item.id)}" 
                title="Delete item ${escapeHTML(item.name)}" 
                aria-label="Delete item ${escapeHTML(item.name)}"
              >
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;

      // 2. Mobile Responsive Card (Fits 100% width, no horizontal scroll)
      cardsHtml += `
        <article class="inventory-item-card ${isLowStock ? 'card-low-stock' : ''}">
          <div class="card-top">
            <div class="card-title-group">
              <h3 class="card-item-name">${escapeHTML(item.name)}</h3>
              <span class="card-item-sku">${escapeHTML(item.id || 'MAL-0000')}</span>
            </div>
            <div class="card-status-wrapper">
              ${statusBadge}
            </div>
          </div>

          <div class="card-details-grid">
            <div class="card-detail-item">
              <span class="detail-label">Category</span>
              <span class="category-tag">
                <i data-lucide="tag"></i>
                ${escapeHTML(item.category)}
              </span>
            </div>
            <div class="card-detail-item">
              <span class="detail-label">Location / Aisle</span>
              <div class="location-badge">
                <i data-lucide="map-pin"></i>
                <span>${escapeHTML(item.location || 'Unassigned')}</span>
              </div>
            </div>
          </div>

          <div class="card-stock-row ${isLowStock ? 'stock-low-alert' : ''}">
            <span class="stock-label">Current Stock:</span>
            <span class="stock-amount ${isLowStock ? 'text-warning' : ''}">
              <strong>${formatNumber(item.quantity)}</strong> ${escapeHTML(item.unit)}
            </span>
          </div>

          <div class="card-actions-row">
            <button 
              type="button" 
              class="btn btn-sm btn-outline btn-edit" 
              data-id="${escapeHTML(item.id)}" 
              title="Edit item ${escapeHTML(item.name)}" 
              aria-label="Edit item ${escapeHTML(item.name)}"
            >
              <i data-lucide="pencil"></i>
              <span>Edit</span>
            </button>
            <button 
              type="button" 
              class="btn btn-sm btn-outline btn-delete" 
              data-id="${escapeHTML(item.id)}" 
              title="Delete item ${escapeHTML(item.name)}" 
              aria-label="Delete item ${escapeHTML(item.name)}"
            >
              <i data-lucide="trash-2"></i>
              <span>Delete</span>
            </button>
          </div>
        </article>
      `;
    });

    dom.inventoryTbody.innerHTML = rowsHtml;
    if (dom.mobileCardsWrapper) {
      dom.mobileCardsWrapper.innerHTML = cardsHtml;
    }

    // Attach Event Listeners to Edit & Delete Action Buttons across table & cards
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openDeleteModal(id);
      });
    });
  }

  // ==========================================================================
  // 9. Form Validation & Handling (Add / Edit)
  // ==========================================================================

  /**
   * Reset all validation error states
   */
  function clearFormErrors() {
    dom.errorItemName.textContent = '';
    dom.errorItemCategory.textContent = '';
    dom.errorItemLocation.textContent = '';
    dom.errorItemQuantity.textContent = '';
    dom.errorItemUnit.textContent = '';

    dom.formItemName.classList.remove('is-invalid');
    dom.formItemCategory.classList.remove('is-invalid');
    dom.formItemCustomCategory.classList.remove('is-invalid');
    dom.formItemLocation.classList.remove('is-invalid');
    dom.formItemQuantity.classList.remove('is-invalid');
    dom.formItemUnit.classList.remove('is-invalid');
    dom.formItemCustomUnit.classList.remove('is-invalid');
  }

  /**
   * Open modal in "Add New Item" mode
   */
  function openAddModal() {
    state.editingItemId = null;
    dom.formItemId.value = '';
    dom.itemForm.reset();
    clearFormErrors();

    // Reset custom inputs
    dom.formItemCustomCategory.classList.add('hidden');
    dom.formItemCustomUnit.classList.add('hidden');

    dom.modalTitle.textContent = 'Add Mall Inventory Item';
    dom.modalSubmitLabel.textContent = 'Save Item';
    dom.modalHeaderIcon.setAttribute('data-lucide', 'package-plus');

    dom.itemModal.classList.remove('hidden');
    refreshIcons();
    dom.formItemName.focus();
  }

  /**
   * Open modal in "Edit Inventory Item" mode
   */
  function openEditModal(itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) {
      showToast('Error', 'Item not found in mall inventory.', 'error');
      return;
    }

    state.editingItemId = itemId;
    clearFormErrors();
    dom.itemForm.reset();

    dom.formItemId.value = item.id;
    dom.formItemName.value = item.name;
    dom.formItemLocation.value = item.location;
    dom.formItemQuantity.value = item.quantity;

    // Handle Category: check if preset or custom
    let categoryFound = false;
    for (let opt of dom.formItemCategory.options) {
      if (opt.value.toLowerCase() === item.category.toLowerCase()) {
        dom.formItemCategory.value = opt.value;
        categoryFound = true;
        break;
      }
    }
    if (!categoryFound) {
      dom.formItemCategory.value = 'custom';
      dom.formItemCustomCategory.value = item.category;
      dom.formItemCustomCategory.classList.remove('hidden');
    } else {
      dom.formItemCustomCategory.classList.add('hidden');
    }

    // Handle Unit: check if preset or custom
    let unitFound = false;
    for (let opt of dom.formItemUnit.options) {
      if (opt.value.toLowerCase() === item.unit.toLowerCase()) {
        dom.formItemUnit.value = opt.value;
        unitFound = true;
        break;
      }
    }
    if (!unitFound) {
      dom.formItemUnit.value = 'custom';
      dom.formItemCustomUnit.value = item.unit;
      dom.formItemCustomUnit.classList.remove('hidden');
    } else {
      dom.formItemCustomUnit.classList.add('hidden');
    }

    dom.modalTitle.textContent = 'Edit Mall Inventory Item';
    dom.modalSubmitLabel.textContent = 'Update Item';
    dom.modalHeaderIcon.setAttribute('data-lucide', 'pencil');

    dom.itemModal.classList.remove('hidden');
    refreshIcons();
    dom.formItemName.focus();
  }

  /**
   * Close Add/Edit modal
   */
  function closeItemModal() {
    dom.itemModal.classList.add('hidden');
    clearFormErrors();
    state.editingItemId = null;
  }

  /**
   * Validate form inputs thoroughly
   */
  function validateForm() {
    clearFormErrors();
    let isValid = true;

    // 1. Validate Item Name
    const nameVal = dom.formItemName.value.trim();
    if (!nameVal) {
      dom.errorItemName.textContent = 'Item name is required.';
      dom.formItemName.classList.add('is-invalid');
      isValid = false;
    } else if (nameVal.length < 2) {
      dom.errorItemName.textContent = 'Item name must be at least 2 characters.';
      dom.formItemName.classList.add('is-invalid');
      isValid = false;
    }

    // 2. Validate Category
    let categoryVal = dom.formItemCategory.value;
    if (!categoryVal) {
      dom.errorItemCategory.textContent = 'Please select a category.';
      dom.formItemCategory.classList.add('is-invalid');
      isValid = false;
    } else if (categoryVal === 'custom') {
      const customCat = dom.formItemCustomCategory.value.trim();
      if (!customCat) {
        dom.errorItemCategory.textContent = 'Please enter a custom category name.';
        dom.formItemCustomCategory.classList.add('is-invalid');
        isValid = false;
      }
    }

    // 3. Validate Mall Location / Store
    const locationVal = dom.formItemLocation.value.trim();
    if (!locationVal) {
      dom.errorItemLocation.textContent = 'Mall location or store name is required.';
      dom.formItemLocation.classList.add('is-invalid');
      isValid = false;
    }

    // 4. Validate Quantity (must be non-negative)
    const qtyRaw = dom.formItemQuantity.value;
    if (qtyRaw === '' || qtyRaw === null) {
      dom.errorItemQuantity.textContent = 'Quantity is required.';
      dom.formItemQuantity.classList.add('is-invalid');
      isValid = false;
    } else {
      const qtyNum = Number(qtyRaw);
      if (isNaN(qtyNum)) {
        dom.errorItemQuantity.textContent = 'Please enter a valid number.';
        dom.formItemQuantity.classList.add('is-invalid');
        isValid = false;
      } else if (qtyNum < 0) {
        dom.errorItemQuantity.textContent = 'Stock quantity cannot be negative.';
        dom.formItemQuantity.classList.add('is-invalid');
        isValid = false;
      }
    }

    // 5. Validate Unit of Measurement
    let unitVal = dom.formItemUnit.value;
    if (!unitVal) {
      dom.errorItemUnit.textContent = 'Please select a unit of measurement.';
      dom.formItemUnit.classList.add('is-invalid');
      isValid = false;
    } else if (unitVal === 'custom') {
      const customUnit = dom.formItemCustomUnit.value.trim();
      if (!customUnit) {
        dom.errorItemUnit.textContent = 'Please enter a custom unit.';
        dom.formItemCustomUnit.classList.add('is-invalid');
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Handle form submission (Add or Update)
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Validation Warning', 'Please resolve the highlighted form errors.', 'warning');
      return;
    }

    const name = dom.formItemName.value.trim();
    const location = dom.formItemLocation.value.trim();
    const quantity = Math.max(0, parseFloat(dom.formItemQuantity.value) || 0);

    let category = dom.formItemCategory.value;
    if (category === 'custom') {
      category = dom.formItemCustomCategory.value.trim();
    }

    let unit = dom.formItemUnit.value;
    if (unit === 'custom') {
      unit = dom.formItemCustomUnit.value.trim();
    }

    if (state.editingItemId) {
      // --- Update Existing Item ---
      const index = state.items.findIndex(i => i.id === state.editingItemId);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          name,
          category,
          location,
          quantity,
          unit,
          updatedAt: new Date().toISOString()
        };

        saveItemsToStorage();
        closeItemModal();
        render();

        if (quantity < LOW_STOCK_THRESHOLD) {
          showToast('Item Updated', `"${name}" updated. Note: low stock alert (${quantity} ${unit}).`, 'warning');
        } else {
          showToast('Item Updated', `"${name}" updated successfully.`, 'success');
        }
      }
    } else {
      // --- Add New Item ---
      const newItem = {
        id: generateSKU(),
        name,
        category,
        location,
        quantity,
        unit,
        createdAt: new Date().toISOString()
      };

      state.items.unshift(newItem); // Place newest at top
      saveItemsToStorage();
      closeItemModal();
      render();

      if (quantity < LOW_STOCK_THRESHOLD) {
        showToast('Item Added', `"${name}" saved with a low stock warning (${quantity} ${unit}).`, 'warning');
      } else {
        showToast('Item Added', `"${name}" added to mall inventory.`, 'success');
      }
    }
  }

  // ==========================================================================
  // 10. Delete Item Modal & Confirmation
  // ==========================================================================

  /**
   * Open Delete confirmation dialog with target item's details
   */
  function openDeleteModal(itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    state.itemToDelete = item;

    dom.deleteItemName.textContent = item.name;
    dom.deleteItemCategory.textContent = item.category;
    dom.deleteItemLocation.textContent = item.location || 'Unassigned';
    dom.deleteItemQty.textContent = `${formatNumber(item.quantity)} ${item.unit}`;

    dom.deleteModal.classList.remove('hidden');
    refreshIcons();
    dom.deleteCancelBtn.focus();
  }

  /**
   * Close delete modal
   */
  function closeDeleteModal() {
    dom.deleteModal.classList.add('hidden');
    state.itemToDelete = null;
  }

  /**
   * Execute permanent item deletion
   */
  function handleConfirmDelete() {
    if (!state.itemToDelete) return;

    const itemName = state.itemToDelete.name;
    const itemId = state.itemToDelete.id;

    state.items = state.items.filter(i => i.id !== itemId);
    saveItemsToStorage();

    closeDeleteModal();
    render();
    showToast('Item Deleted', `"${itemName}" was removed from mall inventory.`, 'success');
  }

  // ==========================================================================
  // 11. Seed & Sample Data Helper
  // ==========================================================================

  function handleSeedData() {
    if (state.items.length > 0) {
      const confirmReset = window.confirm(
        'Reload sample mall items? This will reset your current inventory records to default mall demo items.'
      );
      if (!confirmReset) return;
    }

    state.items = [...SAMPLE_ITEMS];
    saveItemsToStorage();
    resetAllFilters();
    showToast('Mall Demo Data Loaded', 'Sample shopping mall inventory items have been loaded.', 'success');
  }

  // ==========================================================================
  // 12. Search & Filter Handlers
  // ==========================================================================

  function resetAllFilters() {
    state.searchQuery = '';
    state.selectedCategory = 'all';
    state.selectedStatus = 'all';
    state.sortBy = 'name-asc';

    dom.searchInput.value = '';
    dom.categoryFilter.value = 'all';
    dom.statusFilter.value = 'all';
    dom.sortFilter.value = 'name-asc';

    render();
  }

  // ==========================================================================
  // 13. CSV Export Functionality
  // ==========================================================================

  function exportToCSV() {
    const itemsToExport = getProcessedItems();

    if (itemsToExport.length === 0) {
      showToast('Export Notice', 'No items available to export with current filters.', 'info');
      return;
    }

    const headers = ['Item ID', 'Item Name', 'Mall Category', 'Mall Location / Store', 'Quantity in Stock', 'Unit', 'Stock Status'];

    const rows = itemsToExport.map(item => {
      const status = Number(item.quantity) < LOW_STOCK_THRESHOLD ? 'LOW STOCK' : 'IN STOCK';
      return [
        `"${(item.id || '').replace(/"/g, '""')}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category.replace(/"/g, '""')}"`,
        `"${(item.location || '').replace(/"/g, '""')}"`,
        item.quantity,
        `"${item.unit.replace(/"/g, '""')}"`,
        `"${status}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `MallPilot_Mall_Inventory_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Export Complete', `Exported ${itemsToExport.length} mall records to CSV.`, 'success');
  }

  // ==========================================================================
  // 14. Responsive Mobile Sidebar Controls
  // ==========================================================================

  function openMobileSidebar() {
    dom.sidebar.classList.add('open');
    dom.sidebarBackdrop.classList.add('active');
  }

  function closeMobileSidebar() {
    dom.sidebar.classList.remove('open');
    dom.sidebarBackdrop.classList.remove('active');
  }

  // ==========================================================================
  // 15. Event Listeners Setup
  // ==========================================================================

  function bindEvents() {
    // --- Mobile Sidebar Navigation ---
    dom.menuToggleBtn.addEventListener('click', openMobileSidebar);
    dom.mobileCloseBtn.addEventListener('click', closeMobileSidebar);
    dom.sidebarBackdrop.addEventListener('click', closeMobileSidebar);

    // --- Sidebar Quick Links ---
    dom.navAllItems.addEventListener('click', () => {
      state.selectedCategory = 'all';
      state.selectedStatus = 'all';
      dom.categoryFilter.value = 'all';
      dom.statusFilter.value = 'all';
      closeMobileSidebar();
      render();
    });

    dom.navLowStock.addEventListener('click', () => {
      state.selectedStatus = 'low';
      dom.statusFilter.value = 'low';
      closeMobileSidebar();
      render();
    });

    // Stat card click to filter low stock
    dom.statCardLowStock.style.cursor = 'pointer';
    dom.statCardLowStock.addEventListener('click', () => {
      state.selectedStatus = 'low';
      dom.statusFilter.value = 'low';
      render();
    });

    // Load sample data button in sidebar
    dom.btnSeedData.addEventListener('click', handleSeedData);

    // --- Search Input ---
    dom.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      render();
    });

    dom.clearSearchBtn.addEventListener('click', () => {
      state.searchQuery = '';
      dom.searchInput.value = '';
      render();
      dom.searchInput.focus();
    });

    // --- Filters & Sorting ---
    dom.categoryFilter.addEventListener('change', (e) => {
      state.selectedCategory = e.target.value;
      render();
    });

    dom.statusFilter.addEventListener('change', (e) => {
      state.selectedStatus = e.target.value;
      render();
    });

    dom.sortFilter.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      render();
    });

    dom.resetFiltersBtn.addEventListener('click', resetAllFilters);
    dom.btnClearAllFilters.addEventListener('click', resetAllFilters);

    // --- Modal Triggers ---
    dom.openAddModalBtn.addEventListener('click', openAddModal);
    dom.modalCloseBtn.addEventListener('click', closeItemModal);
    dom.modalCancelBtn.addEventListener('click', closeItemModal);

    // Category select custom toggle
    dom.formItemCategory.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        dom.formItemCustomCategory.classList.remove('hidden');
        dom.formItemCustomCategory.focus();
      } else {
        dom.formItemCustomCategory.classList.add('hidden');
      }
    });

    // Unit select custom toggle
    dom.formItemUnit.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        dom.formItemCustomUnit.classList.remove('hidden');
        dom.formItemCustomUnit.focus();
      } else {
        dom.formItemCustomUnit.classList.add('hidden');
      }
    });

    // Form submit
    dom.itemForm.addEventListener('submit', handleFormSubmit);

    // Prevent negative numbers on quantity input in real time
    dom.formItemQuantity.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (val < 0) {
        dom.errorItemQuantity.textContent = 'Stock quantity cannot be negative.';
        dom.formItemQuantity.classList.add('is-invalid');
      } else {
        dom.errorItemQuantity.textContent = '';
        dom.formItemQuantity.classList.remove('is-invalid');
      }
    });

    // --- Delete Modal ---
    dom.deleteModalCloseBtn.addEventListener('click', closeDeleteModal);
    dom.deleteCancelBtn.addEventListener('click', closeDeleteModal);
    dom.deleteConfirmBtn.addEventListener('click', handleConfirmDelete);

    // --- CSV Export ---
    dom.btnExportCsv.addEventListener('click', exportToCSV);

    // --- Global Keyboard & Backdrop Listeners ---
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!dom.itemModal.classList.contains('hidden')) closeItemModal();
        if (!dom.deleteModal.classList.contains('hidden')) closeDeleteModal();
        closeMobileSidebar();
      }
    });

    // Click outside modal card to close
    dom.itemModal.addEventListener('click', (e) => {
      if (e.target === dom.itemModal) closeItemModal();
    });

    dom.deleteModal.addEventListener('click', (e) => {
      if (e.target === dom.deleteModal) closeDeleteModal();
    });
  }

  // ==========================================================================
  // 16. App Initialization
  // ==========================================================================

  function init() {
    loadItemsFromStorage();
    bindEvents();
    render();
  }

  // Bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Ensure icons are rendered even if CDN script arrives slightly after DOMContentLoaded
  window.addEventListener('load', refreshIcons);

})();
