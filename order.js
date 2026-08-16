/* ==========================================================
   KAMIL SALAMEH PHOTOGRAPHY STUDIO — STORE & SIMULATOR JS
   ========================================================== */

let cart = [];

// SIMULATOR STATE
let currentConfig = {
    artworkTitle: 'Faqra Temple, Lebanon',
    artworkSrc: 'images/lebanon.jpg.avif',
    medium: 'framed-canvas',
    size: 'A1',
    frameColor: 'black',
    price: 1250
};

// PRICING MATRICES
const PRICING = {
    'desk-wood': { 'A5': 180, 'A4': 240, 'A3': 320 },
    'unframed-canvas': { 'A5': 250, 'A4': 320, 'A3': 450, 'A2': 750, 'A1': 1100, 'A0': 1800 },
    'framed-canvas': { 'A5': 350, 'A4': 450, 'A3': 600, 'A2': 950, 'A1': 1400, 'A0': 2400 }
};

// WALL SIMULATOR DIMENSION SCALING (WIDTH in PX)
const SIZE_DIMENSIONS = {
    'A5': { width: 140, height: 95 },
    'A4': { width: 180, height: 120 },
    'A3': { width: 230, height: 153 },
    'A2': { width: 300, height: 200 },
    'A1': { width: 380, height: 253 },
    'A0': { width: 480, height: 320 }
};

// INITIALIZE STORE SIMULATOR
document.addEventListener('DOMContentLoaded', () => {
    updateSizeOptions();
    recalculateSimulator();
});

// SELECT ARTWORK
function selectArtwork(src, title, element) {
    document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    currentConfig.artworkSrc = src;
    currentConfig.artworkTitle = title;
    document.getElementById('stageImg').src = src;
}

// SET MEDIUM FORMAT
function setMedium(mediumKey, element) {
    document.querySelectorAll('#mediumOptions .opt-btn').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    currentConfig.medium = mediumKey;

    // Toggle Frame Color Selector availability
    const frameGroup = document.getElementById('frameColorGroup');
    if (mediumKey === 'unframed-canvas') {
        frameGroup.style.display = 'none';
        currentConfig.frameColor = 'none';
    } else if (mediumKey === 'desk-wood') {
        frameGroup.style.display = 'none';
        currentConfig.frameColor = 'wooden';
    } else {
        frameGroup.style.display = 'block';
        currentConfig.frameColor = 'black';
    }

    updateSizeOptions();
    recalculateSimulator();
}

// UPDATE AVAILABLE SIZES BASED ON MEDIUM
function updateSizeOptions() {
    const sizeContainer = document.getElementById('sizeOptions');
    sizeContainer.innerHTML = '';

    const availableSizes = Object.keys(PRICING[currentConfig.medium]);
    if (!availableSizes.includes(currentConfig.size)) {
        currentConfig.size = availableSizes[0];
    }

    availableSizes.forEach(size => {
        const btn = document.createElement('button');
        btn.className = `opt-btn ${size === currentConfig.size ? 'active' : ''}`;
        btn.textContent = size;
        btn.onclick = () => {
            document.querySelectorAll('#sizeOptions .opt-btn').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            currentConfig.size = size;
            recalculateSimulator();
        };
        sizeContainer.appendChild(btn);
    });
}

// SET FRAME FINISH COLOR
function setFrameColor(colorKey, element) {
    document.querySelectorAll('#frameColorGroup .opt-btn').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    currentConfig.frameColor = colorKey;
    recalculateSimulator();
}

// RECALCULATE PRICE AND VISUAL SCALE
function recalculateSimulator() {
    // Calculate Price
    const basePrice = PRICING[currentConfig.medium][currentConfig.size];
    let frameMarkup = 0;

    if (currentConfig.medium === 'framed-canvas') {
        if (currentConfig.frameColor === 'gold') frameMarkup = 150;
        else if (currentConfig.frameColor === 'wooden') frameMarkup = 80;
    }

    currentConfig.price = basePrice + frameMarkup;
    document.getElementById('simPrice').textContent = `$${currentConfig.price.toLocaleString()}`;

    // Apply Wall Frame Styling & Scaling
    const frameElement = document.getElementById('artFrame');
    const dims = SIZE_DIMENSIONS[currentConfig.size];

    frameElement.style.width = `${dims.width}px`;
    frameElement.style.height = `${dims.height}px`;

    // Reset frame classes
    frameElement.className = 'artwork-frame-container';
    if (currentConfig.medium === 'unframed-canvas') {
        frameElement.classList.add('frame-style-none');
    } else if (currentConfig.medium === 'desk-wood') {
        frameElement.classList.add('frame-style-wooden');
    } else {
        frameElement.classList.add(`frame-style-${currentConfig.frameColor}`);
    }
}

// ADD CUSTOM PIECE TO BAG
function addSimulatedToCart() {
    const cartItem = {
        id: Date.now(),
        title: `${currentConfig.artworkTitle}`,
        meta: `${getMediumName(currentConfig.medium)} (${currentConfig.size}) ${currentConfig.frameColor !== 'none' ? '- ' + capitalize(currentConfig.frameColor) + ' Frame' : ''}`,
        price: currentConfig.price,
        img: currentConfig.artworkSrc
    };

    cart.push(cartItem);
    updateCartUI();
    openCartDrawer();
}

// HELPER MODAL CONSTRUCTORS FOR ACCESSORY PRODUCTS
function openCoasterModal() {
    const item = {
        id: Date.now(),
        title: 'Artisan Coaster Set (12 Pack)',
        meta: 'Square Format - Mixed Fine Art Landscapes (Colored)',
        price: 220,
        img: 'images/product-photography.jpg.avif'
    };
    cart.push(item);
    updateCartUI();
    openCartDrawer();
}

function openPuzzleModal() {
    const item = {
        id: Date.now(),
        title: 'Collector Fine Art Puzzle (A2 Size)',
        meta: '1000 Precision-Cut Pieces - Faqra Temple Edition',
        price: 280,
        img: 'images/belgium.jpg.avif'
    };
    cart.push(item);
    updateCartUI();
    openCartDrawer();
}

function openBookModal() {
    const item = {
        id: Date.now(),
        title: 'Bespoke Travel & Memory Photo Book',
        meta: 'Custom Hardcover Magazine Format (Up to 100 Photos)',
        price: 1200,
        img: 'images/kenya.jpg.avif'
    };
    cart.push(item);
    updateCartUI();
    openCartDrawer();
}

function openCustomizerModal(mediumKey) {
    setMedium(mediumKey, document.querySelector(`#mediumOptions button[onclick*="${mediumKey}"]`));
    window.scrollTo({ top: 300, behavior: 'smooth' });
}

// CART DRAWER MANAGEMENT
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
                <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem;">Remove</button>
            </div>
        `;
    }).join('');

    totalDisplay.textContent = `$${total.toLocaleString()}`;
}

// CASH ON DELIVERY CHECKOUT FORM SUBMISSION
function handleCheckout(event) {
    event.preventDefault();

    if (cart.length === 0) {
        alert('Your shopping bag is empty.');
        return;
    }

    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;

    alert(`Thank you, ${name}! Your order has been placed successfully.\n\nOur concierge team will contact you at ${phone} to confirm delivery to:\n${address}\n\nPayment Method: Cash on Delivery.`);

    cart = [];
    updateCartUI();
    closeCartDrawer();
    document.getElementById('checkoutForm').reset();
}

// UTILITY HELPERS
function getMediumName(key) {
    if (key === 'framed-canvas') return 'Framed Canvas Print';
    if (key === 'unframed-canvas') return 'Unframed Canvas Print';
    if (key === 'desk-wood') return 'Desk Wooden Frame Print';
    return key;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
