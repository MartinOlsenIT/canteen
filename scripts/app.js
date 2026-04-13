import { db, auth, provider } from './firebase-config.js';
import { collection, onSnapshot, addDoc, updateDoc, doc, getDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let cart = [];
let currentUser = null;

const menuList = document.getElementById('menu-list');
const cartItems = document.getElementById('cart-items');
const totalPriceEl = document.getElementById('total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const userInfo = document.getElementById('user-info');

// Sjekk innlogging og rolle
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        let isAdmin = false;
        if (userSnap.exists()) {
            isAdmin = userSnap.data().rolle === "admin";
        }

        // Oppdater UI med navn og eventuelt admin-knapp
        userInfo.innerHTML = `
            <p>Logget inn som: <strong>${user.displayName}</strong></p>
            ${isAdmin ? '<button id="go-admin" style="background:orange; margin-right:10px;">Gå til Admin-side</button>' : ''}
            <button id="logout-btn" style="background:#cc0000;">Logg ut</button>
        `;

        // Knapp-eventer
        if (isAdmin) {
            document.getElementById('go-admin').onclick = () => window.location.href = 'admin.html';
        }
        document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => location.reload());
        
        checkoutBtn.disabled = false;
    } else {
        window.location.href = 'login.html';
    }
});

// Hent menyen i sanntid
onSnapshot(collection(db, "products"), (snapshot) => {
    menuList.innerHTML = '';
    snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const id = docSnap.id;
        const isAvailable = item.stock > 0;

        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <div>
                <strong>${item.name}</strong> - ${item.price} kr <br>
                <small>Lager: ${item.stock}</small>
            </div>
            <button class="add-btn" ${!isAvailable ? 'disabled' : ''} data-id="${id}" data-name="${item.name}" data-price="${item.price}">
                ${isAvailable ? 'Legg til' : 'Utsolgt'}
            </button>
        `;
        menuList.appendChild(div);
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
    cartItems.innerHTML = '';
    let total = 0;
    cart.forEach((item) => {
        total += item.price;
        const li = document.createElement('li');
        li.innerText = `${item.name} - ${item.price} kr`;
        cartItems.appendChild(li);
    });
    totalPriceEl.innerText = total;
}

checkoutBtn.onclick = async () => {
    if (cart.length === 0) return alert("Korgen er tom!");
    
    try {
        await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            userName: currentUser.displayName,
            items: cart,
            status: "mottatt",
            timestamp: serverTimestamp()
        });

        for (const item of cart) {
            await updateDoc(doc(db, "products", item.id), {
                stock: increment(-1)
            });
        }

        alert("Takk for bestillingen!");
        cart = [];
        renderCart();
    } catch (err) {
        console.error(err);
        alert("Feil: " + err.message);
    }
};