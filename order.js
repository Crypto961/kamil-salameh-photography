/* ==========================================================
   KAMIL SALAMEH PHOTOGRAPHY
   Order Form & Live Visual Simulator Script
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    const orderSuccess = document.getElementById('orderSuccess');
    const orderTypeSelect = document.getElementById('orderType');
    
    const visualSimulationWrapper = document.getElementById('visualSimulationWrapper');
    const simulationOptionsGrid = document.getElementById('simulationOptionsGrid');
    const previewCanvasBox = document.getElementById('previewCanvasBox');
    const previewArtworkText = document.getElementById('previewArtworkText');
    const simTitleDisplay = document.getElementById('simTitleDisplay');
    const simSpecsList = document.getElementById('simSpecsList');

    // Product configurations with visual properties
    const productConfigs = {
        "Fine Art Print": {
            title: "Fine Art Print / Canvas",
            optionsHtml: `
                <div class="input-group">
                    <select id="simSize" name="sim_size" required>
                        <option value="" disabled selected></option>
                        <option value="A5">A5 (Compact)</option>
                        <option value="A4">A4 (Standard)</option>
                        <option value="A3">A3 (Medium)</option>
                        <option value="A2">A2 (Large)</option>
                        <option value="A1">A1 (Gallery)</option>
                        <option value="A0">A0 (Monumental)</option>
                    </select>
                    <label for="simSize">Print Size</label>
                </div>
                <div class="input-group">
                    <select id="simFinish" name="sim_finish" required>
                        <option value="" disabled selected></option>
                        <option value="Unframed Fine Art Paper">Unframed Fine Art Paper</option>
                        <option value="Framed - Black">Framed (Black Finish)</option>
                        <option value="Framed - White">Framed (White Finish)</option>
                        <option value="Framed - Grey">Framed (Grey Finish)</option>
                        <option value="Framed - Gold">Framed (Gold Finish)</option>
                        <option value="Framed - Natural Wood">Framed (Natural Wood)</option>
                        <option value="Stretched Canvas">Stretched Canvas Wrap</option>
                    </select>
                    <label for="simFinish">Frame / Material Finish</label>
                </div>
            `,
            updateVisual: (inputs) => {
                const size = inputs.size || 'A4';
                const finish = inputs.finish || 'Framed - Black';
                
                // Adjust border color based on frame finish selection
                if (finish.includes('Black')) previewCanvasBox.style.borderColor = '#111111';
                else if (finish.includes('White')) previewCanvasBox.style.borderColor = '#e5e5e5';
                else if (finish.includes('Grey')) previewCanvasBox.style.borderColor = '#6b7280';
                else if (finish.includes('Gold')) previewCanvasBox.style.borderColor = '#d4af37';
                else if (finish.includes('Wood')) previewCanvasBox.style.borderColor = '#8B5A2B';
                else previewCanvasBox.style.borderColor = '#333333';

                simTitleDisplay.textContent = `Fine Art Print (${size})`;
                simSpecsList.innerHTML = `
                    <li>Format: <span>Fine Art Photographic Print</span></li>
                    <li>Selected Size: <span>${size}</span></li>
                    <li>Finishing: <span>${finish}</span></li>
                `;
            }
        },
        "Desk Frames": {
            title: "Desk Wooden Frame",
            optionsHtml: `
                <div class="input-group">
                    <select id="simSize" name="sim_size" required>
                        <option value="" disabled selected></option>
                        <option value="10x15cm">10x15 cm (Mini Desk)</option>
                        <option value="13x18cm">13x18 cm (Classic Desk)</option>
                        <option value="20x25cm">20x25 cm (Executive Desk)</option>
                    </select>
                    <label for="simSize">Dimensions</label>
                </div>
                <div class="input-group">
                    <select id="simFinish" name="sim_finish" required>
                        <option value="" disabled selected></option>
                        <option value="Light Oak">Light Oak Wood</option>
                        <option value="Dark Walnut">Dark Walnut Wood</option>
                        <option value="Black Wood">Black Solid Wood</option>
                    </select>
                    <label for="simFinish">Wood Grain Finish</label>
                </div>
            `,
            updateVisual: (inputs) => {
                const size = inputs.size || '13x18cm';
                const finish = inputs.finish || 'Light Oak';

                if (finish.includes('Oak')) previewCanvasBox.style.borderColor = '#D2B48C';
                else if (finish.includes('Walnut')) previewCanvasBox.style.borderColor = '#5C4033';
                else previewCanvasBox.style.borderColor = '#1a1a1a';

                simTitleDisplay.textContent = `Desk Wooden Frame`;
                simSpecsList.innerHTML = `
                    <li>Product: <span>Desk Frame Stand</span></li>
                    <li>Dimensions: <span>${size}</span></li>
                    <li>Material: <span>${finish}</span></li>
                `;
            }
        },
        "Coasters": {
            title: "Cup Coaster Set",
            optionsHtml: `
                <div class="input-group">
                    <select id="simShape" name="sim_shape" required>
                        <option value="" disabled selected></option>
                        <option value="Round">Round Silhouette</option>
                        <option value="Square">Square Silhouette</option>
                    </select>
                    <label for="simShape">Coaster Shape</label>
                </div>
                <div class="input-group">
                    <select id="simCount" name="sim_count" required>
                        <option value="" disabled selected></option>
                        <option value="Set of 6">Set of 6 Coasters</option>
                        <option value="Set of 12">Set of 12 Coasters</option>
                    </select>
                    <label for="simCount">Set Quantity</label>
                </div>
            `,
            updateVisual: (inputs) => {
                const shape = inputs.shape || 'Round';
                const count = inputs.count || 'Set of 6';

                previewCanvasBox.style.borderRadius = shape === 'Round' ? '50px' : '16px';
                previewCanvasBox.style.borderColor = '#444';

                simTitleDisplay.textContent = `Cup Coaster Set (${count})`;
                simSpecsList.innerHTML = `
                    <li>Category: <span>Home Decor Coasters</span></li>
                    <li>Silhouette: <span>${shape}</span></li>
                    <li>Quantity: <span>${count}</span></li>
                `;
            }
        },
        "Collector Puzzle": {
            title: "Collector Puzzle",
            optionsHtml: `
                <div class="input-group">
                    <select id="simSize" name="sim_size" required>
                        <option value="" disabled selected></option>
                        <option value="A4 Puzzle">A4 Puzzle (100 Pieces)</option>
                        <option value="A3 Puzzle">A3 Puzzle (300 Pieces)</option>
                        <option value="A2 Puzzle">A2 Puzzle (500 Pieces)</option>
                    </select>
                    <label for="simSize">Puzzle Dimensions</label>
                </div>
                <div class="input-group">
                    <select id="simBox" name="sim_box" required>
                        <option value="" disabled selected></option>
                        <option value="Standard Box">Standard Presentation Box</option>
                        <option value="Luxury Wooden Box">Luxury Engraved Wooden Keepsake Box</option>
                    </select>
                    <label for="simBox">Packaging Style</label>
                </div>
            `,
            updateVisual: (inputs) => {
                const size = inputs.size || 'A4 Puzzle';
                const box = inputs.box || 'Standard Box';

                previewCanvasBox.style.borderRadius = '12px';
                previewCanvasBox.style.borderColor = '#6fa7c7';

                simTitleDisplay.textContent = `Collector Puzzle`;
                simSpecsList.innerHTML = `
                    <li>Item: <span>Photo Collector Puzzle</span></li>
                    <li>Size: <span>${size}</span></li>
                    <li>Packaging: <span>${box}</span></li>
                `;
            }
        },
        "Memory Book": {
            title: "Bespoke Memory Book",
            optionsHtml: `
                <div class="input-group">
                    <select id="simTheme" name="sim_theme" required>
                        <option value="" disabled selected></option>
                        <option value="Travel">Travel & Landscapes</option>
                        <option value="Anniversary">Anniversary Collection</option>
                        <option value="Wedding">Wedding Storybook</option>
                        <option value="Architecture">Architectural Portfolio</option>
                    </select>
                    <label for="simTheme">Book Theme</label>
                </div>
                <div class="input-group">
                    <select id="simPages" name="sim_pages" required>
                        <option value="" disabled selected></option>
                        <option value="30 Pages">30 Premium Pages</option>
                        <option value="50 Pages">50 Premium Pages</option>
                        <option value="80 Pages">80 Collector Pages</option>
                    </select>
                    <label for="simPages">Page Count</label>
                </div>
            `,
            updateVisual: (inputs) => {
                const theme = inputs.theme || 'Travel';
                const pages = inputs.pages || '30 Pages';

                previewCanvasBox.style.borderRadius = '6px';
                previewCanvasBox.style.borderColor = '#2c3e50';

                simTitleDisplay.textContent = `Bespoke Memory Book`;
                simSpecsList.innerHTML = `
                    <li>Product: <span>Hardcover Storybook</span></li>
                    <li>Theme: <span>${theme}</span></li>
                    <li>Extent: <span>${pages}</span></li>
                `;
            }
        }
    };

    // Handle dropdown category change
    if (orderTypeSelect) {
        orderTypeSelect.addEventListener('change', function () {
            const val = this.value;
            if (productConfigs[val]) {
                visualSimulationWrapper.classList.add('active');
                simulationOptionsGrid.classList.add('active');
                simulationOptionsGrid.innerHTML = productConfigs[val].optionsHtml;
                
                // Trigger initial visual render
                triggerVisualUpdate(val);
                
                // Add event listeners to newly injected select elements
                simulationOptionsGrid.querySelectorAll('select').forEach(sel => {
                    sel.addEventListener('change', () => triggerVisualUpdate(val));
                });
            } else {
                visualSimulationWrapper.classList.remove('active');
                simulationOptionsGrid.classList.remove('active');
                simulationOptionsGrid.innerHTML = '';
            }
        });
    }

    function triggerVisualUpdate(productKey) {
        const config = productConfigs[productKey];
        if (!config) return;

        const inputs = {};
        simulationOptionsGrid.querySelectorAll('select').forEach(sel => {
            const idName = sel.id.replace('sim', '').toLowerCase();
            inputs[idName] = sel.value;
        });

        config.updateVisual(inputs);
    }

    // Handle form submission
    if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = {
                name: document.getElementById('clientName').value.trim(),
                email: document.getElementById('clientEmail').value.trim(),
                orderType: orderTypeSelect.value,
                itemReference: document.getElementById('printPiece').value.trim(),
                message: document.getElementById('orderDetails').value.trim()
            };

            simulationOptionsGrid.querySelectorAll('select').forEach(sel => {
                formData[sel.name] = sel.value;
            });

            if (!formData.name || !formData.email || !formData.orderType || !formData.message) {
                alert('Please fill in all required fields before submitting.');
                return;
            }

            orderForm.style.display = 'none';
            orderSuccess.style.display = 'block';

            console.log('Order Form Submitted with Visual Simulation State:', formData);
        });
    }
});
