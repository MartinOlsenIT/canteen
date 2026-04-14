import { db, auth, provider } from './firebase-config.js';
import { collection, onSnapshot, addDoc, updateDoc, doc, getDoc, setDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginScreen = document.getElementById('login-screen');
const mainContent = document.getElementById('main-content');
const loginBtn = document.getElementById('login-btn-google');
const userInfo = document.getElementById('user-info');
const menuList = document.getElementById('menu-list');
const cartItems = document.getElementById('cart-items');
const totalPriceEl = document.getElementById('total-price');
const checkoutBtn = document.getElementById('checkout-btn');

let cart = [];
let currentUser = null;

// --- 1. HÅNDTERE INNLOGGINGSTILSTAND ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        
        // Sjekk/Opprett bruker i Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                navn: user.displayName,
                epost: user.email,
                rolle: "elev",
                opprettet: serverTimestamp()
            });
        }

        const isAdmin = userSnap.exists() && userSnap.data().rolle === "admin";

        // Vis innhold, skjul login
        loginScreen.style.display = 'none';
        mainContent.style.display = 'block';

        // Oppdater header
        userInfo.innerHTML = `
            <span style="margin-right:15px;">Hei, <strong>${user.displayName}</strong></span>
            ${isAdmin ? '<button class="btn-admin" id="go-admin">Admin</button>' : ''}
            <button class="btn-danger" id="logout-btn">Logg ut</button>
        `;

        if (isAdmin) document.getElementById('go-admin').onclick = () => window.location.href = 'admin.html';
        document.getElementById('logout-btn').onclick = () => signOut(auth);
        
    } else {
        // Skjul innhold, vis login
        loginScreen.style.display = 'block';
        mainContent.style.display = 'none';
        currentUser = null;
    }
});

// --- 2. LOGG INN FUNKSJON ---
loginBtn.onclick = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (err) {
        alert("Innloggingsfeil: " + err.message);
    }
};

// --- 3. MENY OG BESTILLING (Samme som før) ---
onSnapshot(collection(db, "products"), (snapshot) => {
    menuList.innerHTML = '';
    snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const id = docSnap.id;
        const isAvailable = item.stock > 0;

        menuList.innerHTML += `
            <div class="card">
                <div>
                    <h3>${item.name}</h3>
                    <p class="price-tag">${item.price} kr</p>
                    <p class="stock-tag">${isAvailable ? `Lager: ${item.stock}` : '<span style="color:red;">Utsolgt</span>'}</p>
                </div>
                <button class="btn-primary add-btn" ${!isAvailable ? 'disabled' : ''} 
                    data-id="${id}" data-name="${item.name}" data-price="${item.price}">
                    ${isAvailable ? 'Legg i korg' : 'Utsolgt'}
                </button>
            </div>
        `;
    });

    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = (e) => {
            const { id, name, price } = e.target.dataset;
            cart.push({ id, name, price: parseInt(price) });
            renderCart();
        };
    });
});

function renderCart() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Korgen er tom...</p>';
        totalPriceEl.innerText = '0';
        return;
    }
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name}</span>
            <span>${item.price} kr</span>
        </div>
    `).join('');
    totalPriceEl.innerText = cart.reduce((sum, item) => sum + item.price, 0);
}

checkoutBtn.onclick = async () => {
    if (cart.length === 0) return;
    try {
        await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            userName: currentUser.displayName,
            items: cart,
            status: "mottatt",
            timestamp: serverTimestamp()
        });

        for (const item of cart) {
            await updateDoc(doc(db, "products", item.id), { stock: increment(-1) });
        }
        alert("Bestilling mottatt!");
        cart = [];
        renderCart();
    } catch (err) { alert("Feil: " + err.message); }
};