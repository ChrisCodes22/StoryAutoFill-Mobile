/**
 * Story Template Helper - Server-Hosted Loader
 * Copyright © 2026 Christopher Martinez
 * 
 * This file is loaded by the bookmarklet and contains the full template UI.
 * Update templates by editing templates.json - this file rarely needs changes.
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        templatesURL: 'https://yourserver.com/templates.json', // CHANGE THIS to your server URL
        cacheKey: 'stl_templates_cache',
        cacheExpiry: 3600000, // 1 hour in milliseconds
        version: '2.0.0'
    };

    // Check if already loaded
    if (window.stlTemplateHelper) {
        window.stlTemplateHelper.toggle();
        return;
    }

    // Template Helper Object
    window.stlTemplateHelper = {
        templates: [],
        isOpen: false,
        panel: null,

        // Load templates from server
        loadTemplates: async function() {
            try {
                // Check cache first
                const cached = this.getCachedTemplates();
                if (cached) {
                    console.log('[Story Templates] Loaded from cache');
                    this.templates = cached;
                    return true;
                }

                // Fetch from server
                console.log('[Story Templates] Fetching from server...');
                const response = await fetch(CONFIG.templatesURL + '?_=' + Date.now());
                
                if (!response.ok) {
                    throw new Error('Failed to fetch templates');
                }

                const data = await response.json();
                this.templates = data.templates;
                
                // Cache the templates
                this.cacheTemplates(data);
                
                console.log(`[Story Templates] Loaded ${this.templates.length} templates (v${data.version})`);
                return true;

            } catch (error) {
                console.error('[Story Templates] Load error:', error);
                
                // Try to use cached data even if expired
                const cached = this.getCachedTemplates(true);
                if (cached) {
                    console.log('[Story Templates] Using expired cache as fallback');
                    this.templates = cached;
                    return true;
                }
                
                alert('⚠️ Could not load templates. Please check your connection.');
                return false;
            }
        },

        // Cache management
        getCachedTemplates: function(ignoreExpiry = false) {
            try {
                const cached = localStorage.getItem(CONFIG.cacheKey);
                if (!cached) return null;

                const data = JSON.parse(cached);
                const now = Date.now();
                
                if (!ignoreExpiry && (now - data.timestamp) > CONFIG.cacheExpiry) {
                    return null; // Cache expired
                }

                return data.templates;
            } catch (e) {
                return null;
            }
        },

        cacheTemplates: function(data) {
            try {
                const cacheData = {
                    templates: data.templates,
                    version: data.version,
                    timestamp: Date.now()
                };
                localStorage.setItem(CONFIG.cacheKey, JSON.stringify(cacheData));
            } catch (e) {
                console.warn('[Story Templates] Could not cache templates:', e);
            }
        },

        // Toggle panel
        toggle: function() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        // Open panel
        open: async function() {
            if (this.isOpen) return;

            // Load templates if not loaded
            if (this.templates.length === 0) {
                const loaded = await this.loadTemplates();
                if (!loaded) return;
            }

            this.isOpen = true;
            this.createPanel();
            this.renderTemplates(this.templates);
        },

        // Create UI panel
        createPanel: function() {
            if (document.getElementById('stl-bookmarklet-panel')) return;

            const panel = document.createElement('div');
            panel.id = 'stl-bookmarklet-panel';
            panel.innerHTML = `
                <style>
                    #stl-bookmarklet-panel {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        width: 90%;
                        max-width: 400px;
                        max-height: 80vh;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                        z-index: 999999;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        flex-direction: column;
                        animation: slideIn 0.3s ease-out;
                    }
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateX(20px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    #stl-panel-header {
                        background: linear-gradient(135deg, #1a73e8, #0d47a1);
                        color: white;
                        padding: 15px;
                        border-radius: 12px 12px 0 0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    #stl-panel-title {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                    }
                    #stl-close-btn {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 4px;
                        transition: background 0.2s;
                    }
                    #stl-close-btn:hover {
                        background: rgba(255,255,255,0.2);
                    }
                    #stl-search-box {
                        padding: 12px;
                        border-bottom: 1px solid #e0e0e0;
                        background: #f8f9fa;
                    }
                    #stl-search-input {
                        width: 100%;
                        padding: 10px 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 6px;
                        font-size: 14px;
                        transition: border-color 0.2s;
                    }
                    #stl-search-input:focus {
                        outline: none;
                        border-color: #1a73e8;
                    }
                    #stl-template-list {
                        flex: 1;
                        overflow-y: auto;
                        padding: 10px;
                    }
                    #stl-template-list::-webkit-scrollbar {
                        width: 8px;
                    }
                    #stl-template-list::-webkit-scrollbar-track {
                        background: #f1f1f1;
                    }
                    #stl-template-list::-webkit-scrollbar-thumb {
                        background: #c1c1c1;
                        border-radius: 4px;
                    }
                    #stl-template-list::-webkit-scrollbar-thumb:hover {
                        background: #a1a1a1;
                    }
                    .stl-template-item {
                        background: #f8f9fa;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        padding: 12px;
                        margin-bottom: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .stl-template-item:hover {
                        background: #e3f2fd;
                        border-color: #1a73e8;
                        transform: translateX(-2px);
                    }
                    .stl-template-item:active {
                        transform: scale(0.98);
                    }
                    .stl-template-title {
                        font-weight: 600;
                        color: #1a73e8;
                        font-size: 13px;
                        margin-bottom: 5px;
                    }
                    .stl-template-preview {
                        font-size: 11px;
                        color: #666;
                        line-height: 1.4;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .stl-no-results {
                        text-align: center;
                        padding: 40px 20px;
                        color: #999;
                    }
                    .stl-stats {
                        padding: 10px 12px;
                        border-top: 1px solid #e0e0e0;
                        font-size: 12px;
                        color: #666;
                        text-align: center;
                    }
                </style>
                <div id="stl-panel-header">
                    <h3 id="stl-panel-title">📝 Story Templates</h3>
                    <button id="stl-close-btn">×</button>
                </div>
                <div id="stl-search-box">
                    <input type="text" id="stl-search-input" placeholder="Search templates..." autocomplete="off">
                </div>
                <div id="stl-template-list"></div>
                <div class="stl-stats" id="stl-stats"></div>
            `;

            document.body.appendChild(panel);
            this.panel = panel;

            // Event listeners
            document.getElementById('stl-close-btn').addEventListener('click', () => this.close());
            document.getElementById('stl-search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
        },

        // Render templates
        renderTemplates: function(templates) {
            const listEl = document.getElementById('stl-template-list');
            const statsEl = document.getElementById('stl-stats');

            if (templates.length === 0) {
                listEl.innerHTML = '<div class="stl-no-results">No templates found</div>';
                statsEl.textContent = '0 templates';
                return;
            }

            listEl.innerHTML = templates.map((template, index) => `
                <div class="stl-template-item" data-index="${index}">
                    <div class="stl-template-title">${this.escapeHtml(template.title)}</div>
                    <div class="stl-template-preview">${this.escapeHtml(template.body.substring(0, 80))}...</div>
                </div>
            `).join('');

            statsEl.textContent = `${templates.length} template${templates.length !== 1 ? 's' : ''}`;

            // Add click listeners
            listEl.querySelectorAll('.stl-template-item').forEach((item) => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.index);
                    this.insertTemplate(templates[index]);
                });
            });
        },

        // Search handler
        handleSearch: function(query) {
            const q = query.toLowerCase().trim();
            
            if (!q) {
                this.renderTemplates(this.templates);
                return;
            }

            const filtered = this.templates.filter(template => {
                return template.title.toLowerCase().includes(q) ||
                       template.keywords.some(kw => kw.toLowerCase().includes(q)) ||
                       template.body.toLowerCase().includes(q);
            });

            this.renderTemplates(filtered);
        },

        // Insert template into textarea
        insertTemplate: function(template) {
            // Find the active textarea
            const textareas = document.querySelectorAll('textarea');
            let targetTextarea = null;

            // First, try to find a focused textarea
            for (let ta of textareas) {
                if (document.activeElement === ta) {
                    targetTextarea = ta;
                    break;
                }
            }

            // If no focused textarea, find the first visible one
            if (!targetTextarea) {
                for (let ta of textareas) {
                    if (ta.offsetWidth > 0 && ta.offsetHeight > 0) {
                        targetTextarea = ta;
                        break;
                    }
                }
            }

            if (targetTextarea) {
                targetTextarea.value = template.body;
                targetTextarea.focus();
                
                // Trigger events for NetSuite
                targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                targetTextarea.dispatchEvent(new Event('change', { bubbles: true }));
                
                this.close();
            } else {
                alert('⚠️ No textarea found. Click in a text area first, then use the template helper.');
            }
        },

        // Close panel
        close: function() {
            if (this.panel) {
                this.panel.remove();
                this.panel = null;
            }
            this.isOpen = false;
        },

        // Helper: Escape HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Initialize and open
    window.stlTemplateHelper.open();

})();
