/* ==========================================================
   KAMIL SALAMEH PHOTOGRAPHY
   Order Form & Interactive Product Simulation Script
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    const orderSuccess = document.getElementById('orderSuccess');
    const orderTypeSelect = document.getElementById('orderType');
    const simulationContainer = document.getElementById('simulationContainer');
    const simGridContent = document.getElementById('simGridContent');
    const simHeaderTitle = document.getElementById('simHeaderTitle');

    // Dynamic Product Simulation Configurations
    const productSimulations = {
        "Fine Art Print": {
            title: "Fine Art Print & Canvas Simulation",
            html: `
                <div class="input-group">
                    <select id="simSize" name="sim_size" required>
                        <option value="" disabled selected></option>
                        <option value="A5">A5 (Compact)</option>
                        <option value="A4">A4 (Standard)</option>
                        <option value="A3">A3 (Medium)</option>
                        <option value="A2">A2 (Large)</option>
                        <option value="A1">A1 (Gallery)</option>
                        <option value="A0">A0 (Exhibition Monumental)</option>
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
            `
        },
        "Desk Frames": {
            title: "Desk Wooden Frame Simulation",
            html: `
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
            `
        },
        "Coasters": {
            title: "Cup Coaster Set Simulation",
            html: `
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
            `
        },
        "Collector Puzzle": {
            title: "Collector Puzzle Simulation",
            html: `
                <div class="input-group">
                    <select id="simSize" name="sim_size" required>
                        <option value="" disabled selected></option>
                        <option value="A4 Puzzle">A4 Collector Puzzle (100 Pieces)</option>
                        <option value="A3 Puzzle">A3 Collector Puzzle (300 Pieces)</option>
                        <option value="A2 Puzzle">A2 Collector Puzzle (500 Pieces)</option>
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
            `
        },
        "Memory Book": {
            title: "Bespoke Memory Book Simulation",
            html: `
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
            `
        }
    };

    // Handle interactive product selection change
    if (orderTypeSelect) {
        orderTypeSelect.addEventListener('change', function () {
            const selectedVal = this.value;
            if (productSimulations[selectedVal]) {
                simHeaderTitle.textContent = productSimulations[selectedVal].title;
                simGridContent.innerHTML = productSimulations[selectedVal].html;
                simulationContainer.classList.add('active');
            } else {
                simulationContainer.classList.remove('active');
                simGridContent.innerHTML = '';
            }
        });
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

            // Grab simulation inputs if active
            const simSize = document.getElementById('simSize');
            const simFinish = document.getElementById('simFinish');
            const simShape = document.getElementById('simShape');
            const simCount = document.getElementById('simCount');
            const simBox = document.getElementById('simBox');
            const simTheme = document.getElementById('simTheme');
            const simPages = document.getElementById('simPages');

            if (simSize) formData.size = simSize.value;
            if (simFinish) formData.finish = simFinish.value;
            if (simShape) formData.shape = simShape.value;
            if (simCount) formData.count = simCount.value;
            if (simBox) formData.packaging = simBox.value;
            if (simTheme) formData.theme = simTheme.value;
            if (simPages) formData.pages = simPages.value;

            if (!formData.name || !formData.email || !formData.orderType || !formData.message) {
                alert('Please fill in all required fields before submitting.');
                return;
            }

            orderForm.style.display = 'none';
            orderSuccess.style.display = 'block';

            console.log('Order & Product Simulation Submitted:', formData);
        });
    }
});
