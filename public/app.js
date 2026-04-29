// State
let currentLang = 'de';
let currentUser = null;
let userId = null;
let purchasedItems = [];

// Translations
const translations = {
    de: {
        loginTitle: "Anmelden / Registrieren",
        continue: "Weiter",
        otpTitle: "OTP Verifizierung",
        otpDesc: "Code eingeben (siehe Server-Konsole)",
        verify: "Verifizieren",
        welcome: "Willkommen zum Roblox Shop",
        welcomeDesc: "Verbinde deinen Account und kaufe exklusive Items!",
        linkAccount: "Account verknüpfen",
        shop: "Shop",
        inventory: "Inventar",
        generateCode: "Code generieren",
        yourCode: "Dein Code:",
        validFor: "Gültig für 5 Minuten",
        instructions: "Anleitung:",
        instruction1: "Öffne das Roblox Spiel",
        instruction2: "Gib den Code in die TextBox ein",
        instruction3: "Klicke auf Verify",
        purchaseSuccess: "Kauf erfolgreich!",
        product: "Produkt:",
        itemCode: "Dein Item Code:",
        enterInGame: "Diesen Code im Roblox Spiel eingeben!",
        close: "Schließen",
        goToRoblox: "Zum Roblox Spiel",
        noItems: "Keine Items gekauft"
    },
    en: {
        loginTitle: "Login / Register",
        continue: "Continue",
        otpTitle: "OTP Verification",
        otpDesc: "Enter code (see server console)",
        verify: "Verify",
        welcome: "Welcome to Roblox Shop",
        welcomeDesc: "Link your account and buy exclusive items!",
        linkAccount: "Link Account",
        shop: "Shop",
        inventory: "Inventory",
        generateCode: "Generate Code",
        yourCode: "Your code:",
        validFor: "Valid for 5 minutes",
        instructions: "Instructions:",
        instruction1: "Open the Roblox game",
        instruction2: "Enter the code in the TextBox",
        instruction3: "Click on Verify",
        purchaseSuccess: "Purchase successful!",
        product: "Product:",
        itemCode: "Your Item Code:",
        enterInGame: "Enter this code in Roblox game!",
        close: "Close",
        goToRoblox: "Go to Roblox Game",
        noItems: "No items purchased"
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedUser();
    updateLanguage();
});

// Language Toggle
document.getElementById('langToggle').addEventListener('click', () => {
    currentLang = currentLang === 'de' ? 'en' : 'de';
    document.getElementById('langToggle').textContent = currentLang === 'de' ? 'EN' : 'DE';
    updateLanguage();
});

function updateLanguage() {
    const t = translations[currentLang];
    
    // Update all elements with data-de/data-en attributes
    document.querySelectorAll('[data-de]').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
    });
}

// Auth Functions
async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        alert(currentLang === 'de' ? "Bitte Username und Passwort eingeben" : "Please enter username and password");
        return;
    }
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            userId = data.userId;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('otpForm').style.display = 'block';
            alert(currentLang === 'de' 
                ? `OTP gesendet! Check die Server-Konsole.\n(Code wird dort angezeigt)` 
                : `OTP sent! Check the server console.\n(Code will be displayed there)`);
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Error connecting to server');
    }
}

async function handleVerifyOtp() {
    const otp = document.getElementById('otpInput').value.trim();
    
    if (!otp) {
        alert(currentLang === 'de' ? "Bitte OTP Code eingeben" : "Please enter OTP code");
        return;
    }
    
    try {
        const res = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, otp })
        });
        
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.username;
            localStorage.setItem('robloxShopUser', JSON.stringify({ username: currentUser, userId }));
            showDashboard();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Error verifying OTP');
    }
}

function loadSavedUser() {
    const saved = localStorage.getItem('robloxShopUser');
    if (saved) {
        const user = JSON.parse(saved);
        currentUser = user.username;
        userId = user.userId;
        showDashboard();
    }
}

function logout() {
    localStorage.removeItem('robloxShopUser');
    currentUser = null;
    userId = null;
    location.reload();
}

function showDashboard() {
    document.getElementById('homeSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    document.getElementById('userDisplay').textContent = `👤 ${currentUser}`;
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('logoutBtn').onclick = logout;
    
    loadProducts();
    loadInventory();
}

// Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(pageId).style.display = 'block';
    event.target.classList.add('active');
}

// Link Account
async function generateLinkCode() {
    try {
        const res = await fetch('/api/generate-link-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('linkCodeDisplay').style.display = 'block';
            document.getElementById('linkCode').textContent = data.code;
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Error generating code');
    }
}

// Shop
async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        
        if (data.success) {
            const grid = document.getElementById('productsGrid');
            grid.innerHTML = '';
            
            const icons = ['⚔️', '🎫', '⚡', '🛡️', '💎', '🔥'];
            
            data.products.forEach((product, index) => {
                const name = currentLang === 'de' ? product.name_de : product.name_en;
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-image">${icons[index % icons.length]}</div>
                    <div class="product-info">
                        <h3 class="product-name">${name}</h3>
                        <p class="product-price">${product.price} Coins</p>
                        <button onclick="buyProduct(${product.id})" class="btn-primary">
                            ${currentLang === 'de' ? 'Kaufen' : 'Buy'}
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

async function buyProduct(productId) {
    try {
        const res = await fetch('/api/buy-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId })
        });
        
        const data = await res.json();
        
        if (data.success) {
            // Show modal with item code
            document.getElementById('modalProductName').textContent = data.productName;
            document.getElementById('itemCode').textContent = data.itemCode;
            document.getElementById('itemModal').style.display = 'flex';
            
            // Save to inventory
            purchasedItems.push({
                itemCode: data.itemCode,
                productName: data.productName,
                redeemed: false
            });
            saveInventory();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Error purchasing product');
    }
}

function closeModal() {
    document.getElementById('itemModal').style.display = 'none';
}

// Inventory
function saveInventory() {
    localStorage.setItem('robloxShopInventory', JSON.stringify(purchasedItems));
}

function loadInventory() {
    const saved = localStorage.getItem('robloxShopInventory');
    if (saved) {
        purchasedItems = JSON.parse(saved);
    }
    
    renderInventory();
}

function renderInventory() {
    const list = document.getElementById('inventoryList');
    
    if (purchasedItems.length === 0) {
        list.innerHTML = `<p>${translations[currentLang].noItems}</p>`;
        return;
    }
    
    list.innerHTML = '';
    purchasedItems.forEach(item => {
        const div = document.createElement('div');
        div.className = `inventory-item ${item.redeemed ? 'redeemed' : ''}`;
        div.innerHTML = `
            <div>
                <strong>${item.productName}</strong><br>
                <small>Code: ${item.itemCode}</small>
            </div>
            <span style="color: ${item.redeemed ? 'var(--text-muted)' : 'var(--success)'}">
                ${item.redeemed 
                    ? (currentLang === 'de' ? 'Eingelöst' : 'Redeemed') 
                    : (currentLang === 'de' ? 'Bereit' : 'Ready')}
            </span>
        `;
        list.appendChild(div);
    });
}
