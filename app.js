// 1. Imports mula sa Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrDi30KZ9MJ12ZK-v5zCXOfBGxcnZyGlM",
  authDomain: "ag-boxing-gym.firebaseapp.com",
  projectId: "ag-boxing-gym",
  storageBucket: "ag-boxing-gym.firebasestorage.app",
  messagingSenderId: "840688743753",
  appId: "1:840688743753:web:dab5b9b93ce1b9f5e39698"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const colRef = collection(db, 'gym_inventory');

// 4. UI Elements
const loadingScreen = document.getElementById('loading-screen');
const loginSection = document.getElementById('login-section');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('loginForm');
const inventoryForm = document.getElementById('inventoryForm');
const inventoryList = document.getElementById('inventoryList');

let localChanges = {}; // Para sa temporary qty updates

// --- [AUTH LISTENER]: Dito mawawala ang Loading Screen ---
onAuthStateChanged(auth, (user) => {
    // ITAGO ANG LOADING SCREEN pagkatapos mag-check
    loadingScreen.style.display = 'none';

    if (user) {
        // Naka-login si Coach
        mainApp.style.display = 'block';
        loginSection.style.display = 'none';
        setupRealtimeListener(); // Simulan ang pag-load ng data
    } else {
        // Hindi naka-login
        mainApp.style.display = 'block'; // Papayagan nating lumitaw ang login section
        loginSection.style.display = 'block';
        mainApp.style.display = 'none';
    }
});

// --- [LOGIN LOGIC] ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            console.log("Coach Logged In!");
            loginForm.reset();
        })
        .catch(err => {
            alert("Maling credentials, Coach! Pakicheck uli.");
            console.error(err.message);
        });
});

// --- [LOGOUT LOGIC] ---
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        location.reload(); // I-refresh ang page pag logout
    });
});

// --- [CRUD: CREATE] ---
inventoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addDoc(colRef, {
        name: document.getElementById('itemName').value,
        quantity: parseInt(document.getElementById('itemQty').value),
        createdAt: new Date()
    })
    .then(() => inventoryForm.reset())
    .catch(err => alert("Error: " + err.message));
});

// --- [CRUD: READ & COUNTER] ---
function setupRealtimeListener() {
    const q = query(colRef, orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
        let html = '';
        
        // Update Counter
        const titleElement = document.querySelector('.section-title');
        if (titleElement) titleElement.innerHTML = `Kasalukuyang Stocks (${snapshot.size})`;

        if (snapshot.empty) {
            html = `<div style="text-align: center; padding: 40px; color: #888; border: 2px dashed #ccc;">Wala pang gamit, Coach.</div>`;
        } else {
            snapshot.docs.forEach(doc => {
                const item = doc.data();
                html += `
                    <li class="item-card" style="background: white; padding: 15px 18px; margin-bottom: 20px; border-left: 10px solid #0038A8; box-shadow: 4px 4px 10px rgba(0,0,0,0.05); list-style: none; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;">
                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                            <h3 style="color: #0038A8; margin: 0; padding: 0; text-transform: uppercase; font-family: 'Oswald', sans-serif; font-size: 1.1rem; line-height: 1.2;">${item.name}</h3>
                            <p style="margin: 2px 0 0 0; padding: 0; font-size: 1rem; line-height: 1;">Stock: <span id="qty-val-${doc.id}" style="font-weight: bold; color: #CE1126;">${item.quantity}</span></p>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <button class="edit-btn" data-id="${doc.id}" style="background: #FECB00; border: none; padding: 8px 16px; font-family: 'Oswald', sans-serif; cursor: pointer; font-size: 0.85rem; font-weight: bold; border-radius: 2px;">EDIT</button>
                        </div>
                        <div id="controls-${doc.id}" style="display: none; width: 100%; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <button class="qty-change-btn minus" data-id="${doc.id}" style="background: #CE1126; color: white; border: none; width: 32px; height: 32px; font-size: 1.2rem; cursor: pointer; border-radius: 50%;">-</button>
                                <span id="temp-qty-${doc.id}" style="font-size: 1.2rem; font-weight: bold; min-width: 25px; text-align: center;">${item.quantity}</span>
                                <button class="qty-change-btn plus" data-id="${doc.id}" style="background: #0038A8; color: white; border: none; width: 32px; height: 32px; font-size: 1.2rem; cursor: pointer; border-radius: 50%;">+</button>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <button class="save-btn" data-id="${doc.id}" style="background: #28a745; color: white; border: none; padding: 6px 15px; font-family: 'Oswald', sans-serif; cursor: pointer; font-size: 0.8rem; border-radius: 2px; font-weight: bold;">SAVE</button>
                                <button class="delete-btn" data-id="${doc.id}" style="background: none; color: #CE1126; border: none; cursor: pointer; font-size: 0.7rem; text-decoration: underline; padding: 0;">BURAHIN</button>
                            </div>
                        </div>
                    </li>`;
            });
        }
        inventoryList.innerHTML = html;
    });
}

// --- [CRUD: UPDATE & DELETE LOGIC] ---
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
        const currentQty = parseInt(document.getElementById(`qty-val-${id}`).innerText);
        localChanges[id] = currentQty;
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
        } catch (err) { alert(err.message); }
    }

    if (e.target.classList.contains('delete-btn')) {
        if (confirm("Buburahin na ba?")) await deleteDoc(docRef);
    }
});