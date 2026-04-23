import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDrDi30KZ9MJ12ZK-v5zCXOfBGxcnZyGlM",
    authDomain: "ag-boxing-gym.firebaseapp.com",
    projectId: "ag-boxing-gym",
    storageBucket: "ag-boxing-gym.firebasestorage.app",
    messagingSenderId: "840688743753",
    appId: "1:840688743753:web:dab5b9b93ce1b9f5e39698"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const colRef = collection(db, 'gym_inventory');

const loadingScreen = document.getElementById('loading-screen');
const loginSection = document.getElementById('login-section');
const mainApp = document.getElementById('main-app');
const inventoryList = document.getElementById('inventoryList');

let localChanges = {};

// --- [1. AUTH & SCREEN CONTROLLER] ---
onAuthStateChanged(auth, (user) => {
    loadingScreen.style.display = 'none'; // DITO MAWAWALA ANG LOADING
    if (user) {
        mainApp.style.display = 'block';
        loginSection.style.display = 'none';
        setupRealtimeListener();
    } else {
        loginSection.style.display = 'block';
        mainApp.style.display = 'none';
    }
});

// --- [2. LOGIN/LOGOUT LOGIC] ---
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value)
        .catch(err => alert("Maling credentials, Coach!"));
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => location.reload());
});

// --- [3. CRUD: CREATE] ---
document.getElementById('inventoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addDoc(colRef, {
        name: itemName.value,
        quantity: parseInt(itemQty.value),
        createdAt: new Date()
    }).then(() => inventoryForm.reset());
});

// --- [4. CRUD: READ (REALTIME)] ---
function setupRealtimeListener() {
    const q = query(colRef, orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
        let html = '';
        const titleElement = document.querySelector('.section-title');
        if (titleElement) titleElement.innerHTML = `Kasalukuyang Stocks (${snapshot.size})`;

        if (snapshot.empty) {
            html = `<div style="text-align: center; padding: 40px; border: 2px dashed #ccc; width: 100%; box-sizing: border-box;">Wala pang gamit, Coach.</div>`;
        } else {
            snapshot.docs.forEach(doc => {
                const item = doc.data();
                html += `
                <li class="item-card" style="width: 100%; box-sizing: border-box; background: white; padding: 20px; margin-bottom: 20px; border-left: 10px solid #0038A8; box-shadow: 4px 4px 10px rgba(0,0,0,0.1); list-style: none; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;">
                    
                    <div style="flex: 1; min-width: 0; padding-right: 10px;">
                        <h3 style="color: #0038A8; margin: 0; font-size: 1.3rem; word-break: break-word;">${item.name}</h3>
                        <p style="margin: 5px 0 0 0; font-size: 1.1rem;">Stock: <span id="qty-val-${doc.id}" style="font-weight: bold; color: #CE1126;">${item.quantity}</span></p>
                    </div>

                    <button class="edit-btn" data-id="${doc.id}" style="background: #FECB00; border: none; padding: 10px 20px; font-weight: bold; font-size: 1rem; border-radius: 2px;">EDIT</button>

                    <div id="controls-${doc.id}" style="display: none; width: 100%; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 20px;">
                            <button class="qty-change-btn minus" data-id="${doc.id}" style="background: #CE1126; color: white; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem;">-</button>
                            <span id="temp-qty-${doc.id}" style="font-weight: bold; font-size: 1.4rem;">${item.quantity}</span>
                            <button class="qty-change-btn plus" data-id="${doc.id}" style="background: #0038A8; color: white; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem;">+</button>
                        </div>
                        <div style="display: flex; gap: 15px; align-items: center;">
                            <button class="save-btn" data-id="${doc.id}" style="background: #28a745; color: white; padding: 10px 20px; font-size: 1rem; border-radius: 2px; font-weight: bold;">SAVE</button>
                            <button class="delete-btn" data-id="${doc.id}" style="background: none; color: #CE1126; font-size: 0.8rem; text-decoration: underline;">BURAHIN</button>
                        </div>
                    </div>
                </li>`;
            });
        }
        inventoryList.innerHTML = html;
    });
}

// --- [5. CRUD: UPDATE & DELETE] ---
inventoryList.addEventListener('click', async (e) => {
    const id = e.target.getAttribute('data-id');
    if (!id) return;
    const docRef = doc(db, 'gym_inventory', id);

    if (e.target.classList.contains('edit-btn')) {
        const controls = document.getElementById(`controls-${id}`);
        const isHidden = controls.style.display === 'none';
        controls.style.display = isHidden ? 'flex' : 'none';
        e.target.innerText = isHidden ? 'CANCEL' : 'EDIT';
        e.target.style.background = isHidden ? '#ccc' : '#FECB00';
        
        const currentVal = parseInt(document.getElementById(`qty-val-${id}`).innerText);
        localChanges[id] = currentVal;
        document.getElementById(`temp-qty-${id}`).innerText = currentVal;
    }

    if (e.target.classList.contains('qty-change-btn')) {
        if (e.target.classList.contains('plus')) localChanges[id] += 1;
        else if (e.target.classList.contains('minus') && localChanges[id] > 0) localChanges[id] -= 1;
        document.getElementById(`temp-qty-${id}`).innerText = localChanges[id];
    }

    if (e.target.classList.contains('save-btn')) {
        try {
            await updateDoc(docRef, { quantity: localChanges[id] });
            alert("Updated, Coach!");
            const controls = document.getElementById(`controls-${id}`);
            const editBtn = document.querySelector(`.edit-btn[data-id="${id}"]`);
            if(controls) controls.style.display = 'none';
            if(editBtn) {
                editBtn.innerText = 'EDIT';
                editBtn.style.background = '#FECB00';
            }
        } catch (err) { alert(err.message); }
    }

    if (e.target.classList.contains('delete-btn')) {
        if (confirm("Buburahin na ba?")) await deleteDoc(docRef);
    }
});

// --- [6. PWA INSTALL LOGIC] ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('pwaInstallBtn');
    if(btn) btn.style.display = 'block';
});

const installBtn = document.getElementById('pwaInstallBtn');
if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') installBtn.style.display = 'none';
            deferredPrompt = null;
        }
    });
}

// --- [IPHONE DETECTION & INSTRUCTION] ---
const isIpad = navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1;
const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || isIpad;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

const iosHint = document.getElementById('iosInstallHint');

// Kung naka-iPhone at hindi pa naka-install ang app...
if (isIos && !isStandalone) {
    // Ipakita ang instruction popup pagkatapos ng 3 seconds para hindi mabigla si Coach
    setTimeout(() => {
        if(iosHint) iosHint.style.display = 'block';
    }, 3000);
}

// Button para i-close ang hint
document.getElementById('closeIosHint').addEventListener('click', () => {
    iosHint.style.display = 'none';
});