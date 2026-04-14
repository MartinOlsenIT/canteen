import { db, auth } from './firebase-config.js';
import { collection, onSnapshot, addDoc, updateDoc, doc, getDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let cart = [];
let currentUser = null;

const menuList = document.getElementById('menu-list');
const cartItems = document.getElementById('cart-items');
const totalPriceEl = document.getElementById('total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const userInfo = document.getElementById('user-info');

// Finn logg-inn knappen i HTML-en din (pass på at den har id="login-btn")
const loginBtn = document.getElementById('login-btn');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const isAdmin = userSnap.exists() && userSnap.data().rolle === "admin";

        // SKJUL logg-inn knappen hvis bruker er logget på
        if (loginBtn) loginBtn.style.display = 'none';

        userInfo.innerHTML = `
            <span style="margin-right:15px;">Logget inn som: <strong>${user.displayName}</strong></span>
            ${isAdmin ? '<button class="btn-admin" id="go-admin">Gå til Admin-side</button>' : ''}
            <button class="btn-danger" id="logout-btn">Logg ut</button>
        `;

        if (isAdmin) document.getElementById('go-admin').onclick = () => window.location.href = 'admin.html';
        document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => location.reload());
        checkoutBtn.disabled = false;
    } else {
        // VIS logg-inn knappen hvis ingen er logget på
        if (loginBtn) loginBtn.style.display = 'block';
        userInfo.innerHTML = '';
        checkoutBtn.disabled = true;
    }
});

// Resten av app.js koden (onSnapshot for meny og checkout) forblir lik som før...
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
                    ${isAvailable ? 'Legg i korg' : 'Ikke tilgjengelig'}
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