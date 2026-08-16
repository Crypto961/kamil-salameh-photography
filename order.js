/* ==========================================================
   PREMIUM STUDIO CONFIGURATOR LOGIC
   ========================================================== */

let cart = [];
let currentState = {
    product: 'canvas-framed',
    size: 'A1',
    price: 1400,
    imageSrc: 'https://picsum.photos/id/1015/800/600'
};

// Accordion Logic
function toggleAccordion(id) {
    const content = document.getElementById(id);
    const isActive = content.classList.contains('active');
    
    // Close all
    document.querySelectorAll('.accordion-content').forEach(el => {
        el.classList.remove('active');
    });

    // Toggle target
    if (!isActive) {
        content.classList.add('active');
    }
}

// Product Selection
function selectProduct(type, btn) {
    document.querySelectorAll('#acc-collection .btn-select').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    currentState.product = type;
    
    // Toggle Frame Options visibility
    const finishSection = document.getElementById('finish-section');
    if (type === 'canvas-unframed' || type === 'puzzle') {
        finishSection.style.display = 'none';
        document.getElementById('artStage').style.setProperty('--frame-border', 'none');
    } else {
        finishSection.style.display = 'block';
        const activeFrame = document.querySelector('#acc-finish .btn-select.active');
        if(activeFrame) selectFrame(activeFrame);
    }

    updatePrice();
}

// Artwork Selection
function selectArt(img) {
    document.querySelectorAll('.img-thumb').forEach(el => el.classList.remove('active'));
    img.classList.add('active');
    currentState.imageSrc = img.src;
    
    const previewImg = document.getElementById('previewImg');
    previewImg.src = img.src;

    // Calculate dynamic aspect ratio based on natural image size
    previewImg.onload = function() {
        const ratio = this.naturalWidth / this.naturalHeight;
        document.getElementById('artStage').style.setProperty('--aspect-ratio', ratio);
    };
}

// Size Selection
function selectSize(btn) {
    document.querySelectorAll('#acc-size .btn-select').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    currentState.size = btn.dataset.size;
    
    // Dynamically scale the artwork on the wall
    document.getElementById('artStage').style.setProperty('--frame-width', btn.dataset.width);
    updatePrice();
}

// Frame Selection
function selectFrame(btn) {
    document.querySelectorAll('#acc-finish .btn-select').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('artStage').style.setProperty('--frame-border', btn.dataset.border);
}

// Price Simulator
function updatePrice() {
    let basePrice = 450; 
    if (currentState.size === 'A1') basePrice = 1400;
    if (currentState.size === 'A2') basePrice = 950;
    if (currentState.size === 'A3') basePrice = 600;

    if (currentState.product === 'canvas-unframed') basePrice *= 0.8;
    if (currentState.product === 'puzzle') basePrice = 280;

    currentState.price = basePrice;
    document.getElementById('livePrice').textContent = `$${basePrice.toLocaleString()}`;
}

// Cart Mechanics
function toggleCart() {
    document.getElementById('cartDrawer').classList.toggle('open');
    document.getElementById('cartOverlay').classList.toggle('open');
}

function addToCart() {
    cart.push({
        id: Date.now(),
        product: currentState.product.replace('-', ' ').toUpperCase(),
        size: currentState.size,
        price: currentState.price,
        img: currentState.imageSrc
    });
    
    document.getElementById('cartCount').textContent = cart.length;
    renderCart();
    toggleCart();
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 2rem;">Your cart is empty.</p>';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
            <img src="${item.img}" style="width: 80px; height: 80px; object-fit: cover;">
            <div>
                <div style="font-weight: 600; font-size: 0.9rem;">${item.product}</div>
                <div style="color: var(--text-muted); font-size: 0.8rem;">Dimension: ${item.size}</div>
                <div style="margin-top: 0.5rem; font-family: var(--font-serif);">$${item.price.toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

// Premium Checkout Validation (Email OR Phone Required)
function processCheckout(e) {
    e.preventDefault();
    
    const email = document.getElementById('custEmail').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const errorMsg = document.getElementById('checkoutError');

    // Custom Validation Logic
    if (!email && !phone) {
        errorMsg.style.display = 'block';
        return;
    }

    errorMsg.style.display = 'none';
    
    if (cart.length === 0) {
        alert("Your collection is currently empty.");
        return;
    }

    alert("Thank you. Your bespoke edition request has been received.");
    
    // Reset
    cart = [];
    renderCart();
    document.getElementById('cartCount').textContent = "0";
    document.getElementById('checkoutForm').reset();
    toggleCart();
}
