/* ==========================================================
   KAMIL SALAMEH PHOTOGRAPHY STUDIO — ADVANCED SIMULATOR JS
   ========================================================== */

let cart = [];

// SIMULATOR STATE
let simState = {
    productKey: 'framed-canvas',
    artworkTitle: 'Faqra Temple, Lebanon',
    artworkSrc: 'images/lebanon.jpg.avif',
    selectedArtworks: [
        { src: 'images/lebanon.jpg.avif', title: 'Faqra Temple, Lebanon' }
    ],
    customUploadedImage: null,
    sizeKey: 'A1',
    frameFinish: 'wooden',
    aspectRatio: 1.5,
    price: 1400
};

// PRICING MATRICES
const CATALOG_PRICING = {
    'framed-canvas': { 'A5': 350, 'A4': 450, 'A3': 600, 'A2': 950, 'A1': 1400, 'A0': 2400 },
    'unframed-canvas': { 'A5': 250, 'A4': 320, 'A3': 450, 'A2': 750, 'A1': 1100, 'A0': 1800 },
    'desk-wood': { 'A5': 180, 'A4': 240, 'A3': 320 },
    'coasters': { 'Set of 6': 120, 'Set of 12': 220 },
    'puzzle': { '500 Pcs (A3)': 150, '1000 Pcs (A2)': 280 },
    'photo-book': { 'Standard 40-Page': 600, 'Collector 80-Page': 1200 }
};

const SIZE_SCALES = {
    'A5': 160, 'A4': 210, 'A3': 270, 'A2': 330, 'A1': 390, 'A0': 450,
    'Set of 6': 260, 'Set of 12': 320,
    '500 Pcs (A3)': 270, '1000 Pcs (A2)': 340,
    'Standard 40-Page': 340, 'Collector 80-Page': 390
};

// PUZZLE INTERACTION VARIABLES
let selectedPieces = new Set();
let isDragging = false;
let dragStarted = false;
let startX = 0;
let startY = 0;
let initialPositions = new Map();
let highestZ = 10;

document.addEventListener('DOMContentLoaded', () => {
    updateImageAspectRatio(simState.artworkSrc, () => {
        renderProductControls();
        renderStageSimulation();
    });
});

function updateImageAspectRatio(src, callback) {
    const img = new Image();
    img.onload = () => {
        simState.aspectRatio = (img.naturalWidth && img.naturalHeight) ? (img.naturalWidth / img.naturalHeight) : 1.5;
        if (callback) callback();
    };
    img.onerror = () => {
        simState.aspectRatio = 1.5;
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
    const availableSizes = Object.keys(CATALOG_PRICING[productKey]);
    simState.sizeKey = availableSizes[0];

    const frameGroup = document.getElementById('frameColorGroup');
    if (productKey === 'framed-canvas') {
        frameGroup.style.display = 'block';
        if (simState.frameFinish === 'none') simState.frameFinish = 'wooden';
    } else {
        frameGroup.style.display = 'none';
        simState.frameFinish = 'none';
    }

    const multiHint = document.getElementById('multiSelectHint');
    if (['photo-book', 'coasters'].includes(productKey)) {
        multiHint.style.display = 'inline';
    } else {
        multiHint.style.display = 'none';
    }

    renderProductControls();
    renderStageSimulation();
}

// HANDLE ARTWORK SELECTION (SINGLE OR MULTI)
function handleArtworkClick(src, title, element) {
    const isMultiProduct = ['photo-book', 'coasters'].includes(simState.productKey);

    if (isMultiProduct) {
        const existingIndex = simState.selectedArtworks.findIndex(item => item.src === src);
        if (existingIndex > -1) {
            if (simState.selectedArtworks.length > 1) {
                simState.selectedArtworks.splice(existingIndex, 1);
                element.classList.remove('selected-multi', 'active');
            }
        } else {
            simState.selectedArtworks.push({ src, title });
            element.classList.add('selected-multi', 'active');
        }
        simState.artworkSrc = simState.selectedArtworks[0].src;
        simState.artworkTitle = simState.selectedArtworks[0].title;
    } else {
        document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active', 'selected-multi'));
        element.classList.add('active');

        simState.selectedArtworks = [{ src, title }];
        simState.artworkSrc = src;
        simState.artworkTitle = title;
    }

    updateImageAspectRatio(simState.artworkSrc, () => {
        renderStageSimulation();
    });
}

// CUSTOM IMAGE UPLOAD HANDLERS
function triggerCustomUpload() {
    document.getElementById('customFileInput').click();
}

function handleCustomImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const uploadedSrc = e.target.result;
        const uploadedTitle = `Custom: ${file.name}`;
        simState.customUploadedImage = { src: uploadedSrc, name: file.name };

        const dt = new DataTransfer();
        dt.items.add(file);
        document.getElementById('checkoutCustomFile').files = dt.files;

        simState.selectedArtworks = [{ src: uploadedSrc, title: uploadedTitle }];
        simState.artworkSrc = uploadedSrc;
        simState.artworkTitle = uploadedTitle;

        updateImageAspectRatio(uploadedSrc, () => {
            renderStageSimulation();
        });
    };
    reader.readAsDataURL(file);
}

// RENDER SIZE BUTTONS
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

// SET FRAME FINISH
function setFrameFinish(finishKey, element) {
    document.querySelectorAll('#frameFinishOptions .opt-btn').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    simState.frameFinish = finishKey;
    renderStageSimulation();
}

// RENDER STAGE SIMULATION
function renderStageSimulation() {
    const viewport = document.getElementById('stageViewport');
    const mount = document.getElementById('stageMount');

    if (!viewport || !mount) return;

    let basePrice = CATALOG_PRICING[simState.productKey][simState.sizeKey];
    if (simState.productKey === 'framed-canvas') {
        if (simState.frameFinish === 'gold') basePrice += 100;
        if (simState.frameFinish === 'wooden') basePrice += 50;
    }
    simState.price = basePrice;
    document.getElementById('simPrice').textContent = `$${simState.price.toLocaleString()}`;

    const baseScale = SIZE_SCALES[simState.sizeKey] || 300;
    let targetWidth, targetHeight;

    if (simState.aspectRatio >= 1) {
        targetWidth = baseScale;
        targetHeight = baseScale / simState.aspectRatio;
    } else {
        targetHeight = baseScale;
        targetWidth = baseScale * simState.aspectRatio;
    }

    // 1. PUZZLE INTERACTIVE MODE
    if (simState.productKey === 'puzzle') {
        mount.innerHTML = `
            <div class="puzzle-board-wrapper" id="puzzleBoard">
                <div class="puzzle-piece" data-id="1" style="top: 0px; left: 0px; background-image: url('${simState.artworkSrc}'); background-position: 0px 0px;"></div>
                <div class="puzzle-piece" data-id="2" style="top: 0px; left: 190px; background-image: url('${simState.artworkSrc}'); background-position: -190px 0px;"></div>
                <div class="puzzle-piece" data-id="3" style="top: 125px; left: 0px; background-image: url('${simState.artworkSrc}'); background-position: 0px -125px;"></div>
                <div class="puzzle-piece" data-id="4" style="top: 125px; left: 190px; background-image: url('${simState.artworkSrc}'); background-position: -190px -125px;"></div>
            </div>
        `;
        initPuzzleInteractions();

    // 2. COASTERS MULTI-SELECT DISPLAY
    } else if (simState.productKey === 'coasters') {
        const totalCount = simState.sizeKey === 'Set of 6' ? 6 : 9;
        let coasterHTML = `<div class="coaster-grid-preview">`;
        for (let i = 0; i < totalCount; i++) {
            const artItem = simState.selectedArtworks[i % simState.selectedArtworks.length];
            coasterHTML += `
                <div class="coaster-item-disc">
                    <img src="${artItem.src}" alt="${artItem.title}">
                </div>`;
        }
        coasterHTML += `</div>`;
        mount.innerHTML = coasterHTML;

    // 3. TRAVEL MEMORY BOOK SPREAD (POLAROID FORMAT)
    } else if (simState.productKey === 'photo-book') {
        const leftArt = simState.selectedArtworks[0] || { src: simState.artworkSrc, title: 'Memory 1' };
        const rightArt = simState.selectedArtworks[1] || simState.selectedArtworks[0] || { src: simState.artworkSrc, title: 'Memory 2' };

        mount.innerHTML = `
            <div class="book-spread-preview">
                <div class="book-page-half">
                    <div class="polaroid-card">
                        <img src="${leftArt.src}" alt="${leftArt.title}">
                        <div class="polaroid-caption">${leftArt.title}</div>
                    </div>
                </div>
                <div class="book-page-half">
                    <div class="polaroid-card rotate-right">
                        <img src="${rightArt.src}" alt="${rightArt.title}">
                        <div class="polaroid-caption">${rightArt.title}</div>
                    </div>
                </div>
            </div>
        `;

    // 4. CANVAS / DESK FRAME
    } else {
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

// PUZZLE INTERACTION LOGIC
function initPuzzleInteractions() {
    const pieces = document.querySelectorAll('.puzzle-piece');
    const viewport = document.getElementById('stageViewport');

    selectedPieces.clear();

    pieces.forEach(piece => {
        piece.addEventListener('pointerdown', onPuzzlePointerDown);
    });

    if (viewport) {
        viewport.addEventListener('pointerdown', (e) => {
            if (!e.target.classList.contains('puzzle-piece')) {
                clearPuzzleSelection();
            }
        });
    }
}

function onPuzzlePointerDown(e) {
    e.stopPropagation();
    const piece = e.currentTarget;
    const isMultiKey = e.ctrlKey || e.metaKey || e.shiftKey;

    dragStarted = false;
    startX = e.clientX;
    startY = e.clientY;

    if (isMultiKey) {
        if (selectedPieces.has(piece)) {
            selectedPieces.delete(piece);
            piece.classList.remove('selected');
        } else {
            selectedPieces.add(piece);
            piece.classList.add('selected');
        }
    } else {
        if (!selectedPieces.has(piece)) {
            clearPuzzleSelection();
            selectedPieces.add(piece);
            piece.classList.add('selected');
        }
    }

    highestZ += selectedPieces.size;
    selectedPieces.forEach(p => { p.style.zIndex = highestZ; });

    initialPositions.clear();
    selectedPieces.forEach(p => {
        initialPositions.set(p, { left: p.offsetLeft, top: p.offsetTop });
    });

    window.addEventListener('pointermove', onPuzzlePointerMove);
    window.addEventListener('pointerup', onPuzzlePointerUp);
}

function onPuzzlePointerMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragStarted && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        dragStarted = true;
        isDragging = true;
    }

    if (isDragging) {
        selectedPieces.forEach(piece => {
            const initPos = initialPositions.get(piece);
            if (initPos) {
                piece.style.left = `${initPos.left + dx}px`;
                piece.style.top = `${initPos.top + dy}px`;
            }
        });
    }
}

function onPuzzlePointerUp(e) {
    window.removeEventListener('pointermove', onPuzzlePointerMove);
    window.removeEventListener('pointerup', onPuzzlePointerUp);

    if (!dragStarted && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        clearPuzzleSelection();
        const piece = e.target;
        selectedPieces.add(piece);
        piece.classList.add('selected');
    }

    isDragging = false;
    dragStarted = false;
}

function clearPuzzleSelection() {
    selectedPieces.forEach(piece => piece.classList.remove('selected'));
    selectedPieces.clear();
}

// QUICK LOAD FROM CATALOG
function loadProductToSim(productKey) {
    const btn = document.querySelector(`#productLineOptions button[onclick*="${productKey}"]`);
    selectProduct(productKey, btn);
    window.scrollTo({ top: 350, behavior: 'smooth' });
}

// CART DRAWER MANAGEMENT
function addSimulatedToCart() {
    const count = simState.selectedArtworks.length;
    let artworkSummary = simState.artworkTitle;
    if (count > 1) {
        artworkSummary = `${simState.selectedArtworks[0].title} (+${count - 1} selected photos)`;
    }

    const item = {
        id: Date.now(),
        title: artworkSummary,
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
    const customFileInput = document.getElementById('checkoutCustomFile');
    
    let fileInfo = '';
    if (customFileInput.files.length > 0) {
        fileInfo = `\n\nAttached Custom File: ${customFileInput.files[0].name}`;
    }

    alert(`Thank you, ${name}! Your order has been placed.\n\nOur team will contact you at ${phone} to confirm delivery to:\n${address}${fileInfo}\n\nPayment Method: Cash on Delivery.`);

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
