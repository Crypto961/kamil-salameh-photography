/* ==========================================================
   KAMIL SALAMEH PHOTOGRAPHY STUDIO — ADVANCED SIMULATOR JS
   ========================================================== */

let cart = [];

// SIMULATOR STATE
let simState = {
    productKey: 'framed-canvas',
    artworkTitle: 'Faqra Temple, Lebanon',
    artworkSrc: 'images/lebanon.jpg',
    sizeKey: 'A1',
    frameFinish: 'wooden',
    aspectRatio: 1.5, // Natural width / height ratio
    price: 1400
};

// PRICING MATRICES FOR ALL PRODUCTS
const CATALOG_PRICING = {
    'framed-canvas': { 'A5': 350, 'A4': 450, 'A3': 600, 'A2': 950, 'A1': 1400, 'A0': 2400 },
    'unframed-canvas': { 'A5': 250, 'A4': 320, 'A3': 450, 'A2': 750, 'A1': 1100, 'A0': 1800 },
    'desk-wood': { 'A5': 180, 'A4': 240, 'A3': 320 },
    'coasters': { 'Set of 6': 120, 'Set of 12': 220 },
    'puzzle': { '500 Pcs (A3)': 150, '1000 Pcs (A2)': 280 },
    'photo-book': { 'Standard 40-Page': 600, 'Collector 80-Page': 1200 }
};

// RELATIVE DISPLAY BASE SIZES (PIXELS MAX BOUNDARY)
const SIZE_SCALES = {
    'A5': 160,
    'A4': 210,
    'A3': 270,
    'A2': 330,
    'A1': 390,
    'A0': 450,
    'Set of 6': 260,
    'Set of 12': 320,
    '500 Pcs (A3)': 270,
    '1000 Pcs (A2)': 340,
    'Standard 40-Page': 340,
    'Collector 80-Page': 390
};

document.addEventListener('DOMContentLoaded', () => {
    updateImageAspectRatio(simState.artworkSrc, () => {
        renderProductControls();
        renderStageSimulation();
    });
});

// CALCULATE NATURAL ASPECT RATIO TO ENSURE ZERO IMAGE CROPPING
function updateImageAspectRatio(src, callback) {
    const img = new Image();
    img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
            simState.aspectRatio = img.naturalWidth / img.naturalHeight;
        } else {
            simState.aspectRatio = 1.5;
        }
        if (callback) callback();
    };
    img.onerror = () => {
        simState.aspectRatio = 1.5; // Fallback landscape aspect ratio on image path miss
        if (callback) callback();
    };
    img.src = src;
}

// SELECT PRODUCT
function selectProduct(productKey, element) {
    if (element) {
        document.querySelectorAll('#productLineOptions .opt-btn').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
    }

    simState.productKey = productKey;

    // Reset default size for selected product
    const availableSizes = Object.keys(CATALOG_PRICING[productKey]);
    simState.sizeKey = availableSizes[0];

    // Toggle Frame Finish Visibility
    const frameGroup = document.getElementById('frameColorGroup');
    if (productKey === 'framed-canvas') {
        frameGroup.style.display = 'block';
        if (simState.frameFinish === 'none') simState.frameFinish = 'wooden';
    } else {
        frameGroup.style.display = 'none';
        simState.frameFinish = 'none';
    }

    renderProductControls();
    renderStageSimulation();
}

// SELECT ARTWORK
function selectArtwork(src, title, element) {
    document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    simState.artworkSrc = src;
    simState.artworkTitle = title;

    updateImageAspectRatio(src, () => {
        renderStageSimulation();
    });
}

// RENDER DYNAMIC SIZE BUTTONS & PRICING
function renderProductControls() {
    const sizeContainer = document.getElementById('sizeOptions');
    sizeContainer.innerHTML = '';

    const sizes = Object.keys(CATALOG_PRICING[simState.productKey]);
    sizes.forEach(sz => {
        const btn = document.createElement('button');
        btn.className = `opt-btn ${sz === simState.sizeKey ? 'active' : ''}`;
        btn.textContent = sz;
        btn.onclick = () => {
            document.querySelectorAll('#sizeOptions .opt-btn').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            simState.sizeKey = sz;
            renderStageSimulation();
        };
        sizeContainer.appendChild(btn);
    });
}

// SET FRAME FINISH MATERIAL
function setFrameFinish(finishKey, element) {
    document.querySelectorAll('#frameFinishOptions .opt-btn').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    simState.frameFinish = finishKey;
    renderStageSimulation();
}

// RENDER STAGE ENVIRONMENT & DYNAMIC ASPECT RATIO MAPPING
function renderStageSimulation() {
    const viewport = document.getElementById('stageViewport');
    const mount = document.getElementById('stageMount');
    const mockConsole = document.getElementById('mockConsole');
    const mockDesk = document.getElementById('mockDesk');
    const spotlight = document.getElementById('wallSpotlight');

    if (!viewport || !mount) return;

    // Calculate Price
    let basePrice = CATALOG_PRICING[simState.productKey][simState.sizeKey];
    if (simState.productKey === 'framed-canvas') {
        if (simState.frameFinish === 'gold') basePrice += 100;
        if (simState.frameFinish === 'wooden') basePrice += 50;
    }
    simState.price = basePrice;
    document.getElementById('simPrice').textContent = `$${simState.price.toLocaleString()}`;

    // Environment Backdrop Switcher
    if (['framed-canvas', 'unframed-canvas', 'puzzle'].includes(simState.productKey)) {
        viewport.className = 'stage-viewport stage-env-wall';
        mockConsole.style.display = 'block';
        mockDesk.style.display = 'none';
        spotlight.style.display = 'block';
    } else {
        viewport.className = 'stage-viewport stage-env-desk';
        mockConsole.style.display = 'none';
        mockDesk.style.display = 'block';
        spotlight.style.display = 'none';
    }

    // Dynamic Sizing based on Aspect Ratio
    const baseScale = SIZE_SCALES[simState.sizeKey] || 300;
    let targetWidth, targetHeight;

    if (simState.aspectRatio >= 1) { // Landscape
        targetWidth = baseScale;
        targetHeight = baseScale / simState.aspectRatio;
    } else { // Portrait
        targetHeight = baseScale;
        targetWidth = baseScale * simState.aspectRatio;
    }

    // Render Stage Visual Based on Product Type
    if (simState.productKey === 'coasters') {
        const count = simState.sizeKey === 'Set of 6' ? 6 : 9;
        let coasterHTML = `<div class="coaster-grid-preview">`;
        for (let i = 0; i < count; i++) {
            coasterHTML += `
                <div class="coaster-item-disc">
                    <img src="${simState.artworkSrc}" alt="Coaster Print">
                </div>`;
        }
        coasterHTML += `</div>`;
        mount.innerHTML = coasterHTML;

    } else if (simState.productKey === 'photo-book') {
        mount.innerHTML = `
            <div class="book-spread-preview">
                <div class="book-page-half">
                    <img src="${simState.artworkSrc}" alt="Left Page">
                </div>
                <div class="book-page-half">
                    <img src="images/kenya.jpg" alt="Right Page">
                </div>
            </div>
        `;

    } else {
        // Wall Canvas, Unframed Print, Desk Frame, or Puzzle Display
        let frameClass = 'frame-finish-none';
        if (simState.productKey === 'framed-canvas' || simState.productKey === 'desk-wood') {
            frameClass = `frame-finish-${simState.frameFinish === 'none' ? 'wooden' : simState.frameFinish}`;
        }

        mount.innerHTML = `
            <div class="artwork-presentation-box ${frameClass}" style="width: ${targetWidth}px; height: ${targetHeight}px;">
                <img src="${simState.artworkSrc}" alt="${simState.artworkTitle}" class="artwork-image-element">
            </div>
        `;
    }
}

// QUICK LOAD PRODUCT FROM CATALOG CARDS
function loadProductToSim(productKey) {
    const btn = document.querySelector(`#productLineOptions button[onclick*="${productKey}"]`);
    selectProduct(productKey, btn);
    window.scrollTo({ top: 350, behavior: 'smooth' });
}

// CART DRAWER MANAGEMENT
function addSimulatedToCart() {
    const item = {
        id: Date.now(),
        title: `${simState.artworkTitle}`,
        meta: `${getProductName(simState.productKey)} (${simState.sizeKey}) ${simState.frameFinish !== 'none' ? '- ' + capitalize(simState.frameFinish) + ' Finish' : ''}`,
        price: simState.price,
        img: simState.artworkSrc
    };

    cart.push(item);
    updateCartUI();
    openCartDrawer();
}

function openCartDrawer() {
    document.getElementById('cartOverlay').classList.add('open');
}

function closeCartDrawer() {
    document.getElementById('cartOverlay').classList.remove('open');
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const cartList = document.getElementById('cartItemsList');
    const countBadge = document.getElementById('cartCount');
    const totalDisplay = document.getElementById('cartTotalAmount');

    countBadge.textContent = cart.length;

    if (cart.length === 0) {
        cartList.innerHTML = `<p style="text-align: center; color: #888888; padding: 2rem 0;">Your shopping bag is empty.</p>`;
        totalDisplay.textContent = '$0';
        return;
    }

    let total = 0;
    cartList.innerHTML = cart.map(item => {
        total += item.price;
        return `
            <div class="cart-item">
                <img src="${item.img}" class="cart-item-img" alt="${item.title}">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.title}</div>
                    <div class="cart-item-meta">${item.meta}</div>
                    <div class="cart-item-price">$${item.price.toLocaleString()}</div>
                </div>
                <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.82rem;">Remove</button>
            </div>
        `;
    }).join('');

    totalDisplay.textContent = `$${total.toLocaleString()}`;
}

// CHECKOUT SUBMISSION
function handleCheckout(event) {
    event.preventDefault();

    if (cart.length === 0) {
        alert('Your shopping bag is empty.');
        return;
    }

    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;

    alert(`Thank you, ${name}! Your order has been placed.\n\nOur team will contact you at ${phone} to confirm delivery to:\n${address}\n\nPayment Method: Cash on Delivery.`);

    cart = [];
    updateCartUI();
    closeCartDrawer();
    document.getElementById('checkoutForm').reset();
}

function getProductName(key) {
    const names = {
        'framed-canvas': 'Framed Fine Art Canvas',
        'unframed-canvas': 'Unframed Fine Art Canvas',
        'desk-wood': 'Desk Wooden Frame Print',
        'coasters': 'Artisan Coaster Set',
        'puzzle': 'Collector Fine Art Puzzle',
        'photo-book': 'Bespoke Travel Memory Book'
    };
    return names[key] || key;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
