// firebase-db.js
// Firebase is loaded via CDN in index.html

const firebaseConfig = {
    apiKey: "AIzaSyC0GSU9teCC6XMldvPVDTjQHH24yu2FPyU",
    authDomain: "pokemon-mezastar-hub.firebaseapp.com",
    projectId: "pokemon-mezastar-hub",
    storageBucket: "pokemon-mezastar-hub.firebasestorage.app",
    messagingSenderId: "711013635794",
    appId: "1:711013635794:web:513cc4bafb0efd81cdbf0b",
    measurementId: "G-CZFHK7BLF5"
};

// Initialize Firebase only if the user has provided a config
let db = null;
let storage = null;
let auth = null;
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

if (isFirebaseConfigured) {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        storage = firebase.storage();
        auth = firebase.auth();
        console.log("Firebase initialized successfully");
    } catch (e) {
        console.warn("Firebase initialization failed. Using LocalStorage fallback.", e);
    }
} else {
    console.warn("Firebase config is missing. Using LocalStorage fallback. Please update firebase-db.js with your config.");
}

// Global user state
let currentUser = null;
let currentUserId = localStorage.getItem('trainer_user_id') || ('trainer_' + Math.random().toString(36).substr(2, 9));
localStorage.setItem('trainer_user_id', currentUserId);

// Auth state listener
if (auth) {
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
            currentUserId = user.uid;
            console.log("User logged in as:", user.displayName, "| UID:", user.uid);
            await loadUserDataFromFirebase();
        } else {
            currentUserId = localStorage.getItem('trainer_user_id');
            console.log("No user logged in. Using ID:", currentUserId);
        }
        // Update both Auth UI and current screen
        window.updateAuthUI();
        if (typeof renderProfile === 'function') renderProfile();
    });
} else {
    // Mock user load loop for offline portfolio
    const storedMockUser = localStorage.getItem('mock_google_user');
    if (storedMockUser) {
        try {
            currentUser = JSON.parse(storedMockUser);
            currentUserId = currentUser.uid;
        } catch (e) { }
    }
}

window.updateAuthUI = function () {
    const settingsName = document.getElementById('settings-user-name');
    const settingsStatus = document.getElementById('settings-sync-status');
    const settingsAvatar = document.getElementById('settings-user-avatar');
    const loginBtn = document.getElementById('settings-login-btn');
    const logoutBtn = document.getElementById('settings-logout-btn');

    if (currentUser) {
        if (settingsName) settingsName.innerText = currentUser.displayName || 'Trainer';
        if (settingsStatus) {
            settingsStatus.innerHTML = '<span class="material-symbols-outlined text-primary text-[12px]">cloud_done</span> Synced to Cloud';
            settingsStatus.classList.add('text-primary');
            settingsStatus.classList.remove('text-slate-500');
        }
        if (settingsAvatar && currentUser.photoURL) {
            settingsAvatar.innerHTML = `<img src="${currentUser.photoURL}" class="w-full h-full object-cover">`;
        }
        if (loginBtn) loginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        if (settingsName) settingsName.innerText = 'Guest Trainer';
        if (settingsStatus) {
            settingsStatus.innerHTML = '<span class="material-symbols-outlined text-slate-500 text-[12px]">cloud_off</span> Not Synced';
            settingsStatus.classList.remove('text-primary');
            settingsStatus.classList.add('text-slate-500');
        }
        if (settingsAvatar) {
            settingsAvatar.innerHTML = '<span class="material-symbols-outlined text-slate-500 text-2xl">account_circle</span>';
        }
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}

// Login/Logout Actions
window.loginWithGoogle = async function () {
    if (!auth) {
        const mockEmail = prompt("Firebase offline (Portfolio Mode).\nEnter your Gmail to mock login:", "trainer@gmail.com");
        if (mockEmail) {
            const name = mockEmail.split('@')[0];
            const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
            currentUser = {
                displayName: formattedName,
                email: mockEmail,
                uid: 'mock_' + Math.random().toString(36).substr(2, 9),
            };
            currentUserId = currentUser.uid;
            localStorage.setItem('trainer_user_id', currentUserId);
            localStorage.setItem('mock_google_user', JSON.stringify(currentUser));
            showToast("Mock Sign-In Successful!", "success");

            window.updateAuthUI();
            if (typeof window.updateTrainerNameUI === 'function') window.updateTrainerNameUI();
            if (typeof window.renderProfile === 'function') window.renderProfile();
        }
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        showToast("Logged in with Google!", "success");
    } catch (error) {
        console.error("Login failed:", error);
        showToast("Login failed. Check console.", "warning");
    }
}

window.logoutUser = async function () {
    if (!auth) {
        currentUser = null;
        localStorage.removeItem('mock_google_user');
        currentUserId = ('trainer_' + Math.random().toString(36).substr(2, 9));
        localStorage.setItem('trainer_user_id', currentUserId);
        showToast("Logged out.", "info");
        window.updateAuthUI();
        if (typeof window.updateTrainerNameUI === 'function') window.updateTrainerNameUI();
        if (typeof window.renderProfile === 'function') window.renderProfile();
        return;
    }
    try {
        await auth.signOut();
        showToast("Logged out.", "info");
    } catch (error) {
        console.error("Logout failed:", error);
    }
}

// Function to handle Image Uploads (Avatar & QR)
window.handleImageUpload = async function (event, type) {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Show local preview immediately using FileReader
    const reader = new FileReader();
    reader.onload = async (e) => {
        const previewUrl = e.target.result;

        if (type === 'avatar') {
            document.getElementById('profile-trainer-avatar-img').src = previewUrl;
            document.getElementById('profile-trainer-avatar-img').classList.remove('hidden');
            document.getElementById('profile-trainer-avatar-icon').classList.add('hidden');
            localStorage.setItem('trainer_avatar_data', previewUrl); // Fallback locally
        } else if (type === 'qr') {
            document.getElementById('profile-trainer-qr-img').src = previewUrl;
            document.getElementById('profile-trainer-qr-img').classList.remove('hidden');
            document.getElementById('profile-trainer-qr-icon').classList.add('hidden');
            localStorage.setItem('trainer_qr_data', previewUrl); // Fallback locally
        }
    };
    reader.readAsDataURL(file);

    // 2. Upload to Firebase if configured
    if (storage) {
        try {
            const storageRef = storage.ref();
            // Create a unique file path for this user
            const fileRef = storageRef.child(`trainers/${currentUserId}/${type}_${Date.now()}`);
            await fileRef.put(file);
            const downloadUrl = await fileRef.getDownloadURL();

            // Save link to firestore document for this user
            if (db) {
                await db.collection("trainers").doc(currentUserId).set({
                    [type + 'Url']: downloadUrl,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            console.log(`${type} successfully uploaded to Firebase`);
        } catch (error) {
            console.error("Error uploading image to Firebase:", error);
            alert("Error uploading to Firebase. Your image was saved locally instead.");
        }
    }
};

// Firebase sync wrapper for Collection
window.syncCollectionToFirebase = async function (collectionArray) {
    if (!db) return;
    try {
        await db.collection("trainers").doc(currentUserId).set({
            collection: collectionArray,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error syncing collection to Firebase:", error);
    }
}

// Firebase sync wrapper for Battle Log
window.syncBattleLogToFirebase = async function (battleLogArray) {
    if (!db) return;
    try {
        await db.collection("trainers").doc(currentUserId).set({
            battleHistory: battleLogArray,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error syncing battle log to Firebase:", error);
    }
}

// Load fresh cloud data if Firebase is configured
window.loadUserDataFromFirebase = async function () {
    if (!db) return;
    try {
        const doc = await db.collection("trainers").doc(currentUserId).get();
        if (doc.exists) {
            const data = doc.data();
            console.log("Loading user data for UID:", currentUserId);

            // Sync collection if available
            if (data.collection && typeof saveCollection === 'function') {
                localStorage.setItem('pokemon_collection_v1', JSON.stringify(data.collection));
            }

            // Sync battle log if available
            if (data.battleHistory) {
                localStorage.setItem('trainer_battle_log_v1', JSON.stringify(data.battleHistory));
            }

            // Update UI elements
            if (data.avatarUrl) {
                const img = document.getElementById('profile-trainer-avatar-img');
                const icon = document.getElementById('profile-trainer-avatar-icon');
                if (img) {
                    img.src = data.avatarUrl;
                    img.classList.remove('hidden');
                }
                if (icon) icon.classList.add('hidden');
            }
            if (data.qrUrl) {
                const img = document.getElementById('profile-trainer-qr-img');
                const icon = document.getElementById('profile-trainer-qr-icon');
                if (img) {
                    img.src = data.qrUrl;
                    img.classList.remove('hidden');
                }
                if (icon) icon.classList.add('hidden');
            }

            // Trigger UI refresh
            if (typeof renderProfile === 'function') renderProfile();
        }
    } catch (error) {
        console.error("Error fetching trainer doc from Firebase", error);
    }
}

// Load profile data on start
window.addEventListener('DOMContentLoaded', async () => {
    // Check local previews first for instantaneous load
    const localAvatar = localStorage.getItem('trainer_avatar_data');
    if (localAvatar && document.getElementById('profile-trainer-avatar-img')) {
        document.getElementById('profile-trainer-avatar-img').src = localAvatar;
        document.getElementById('profile-trainer-avatar-img').classList.remove('hidden');
        document.getElementById('profile-trainer-avatar-icon').classList.add('hidden');
    }

    const localQr = localStorage.getItem('trainer_qr_data');
    if (localQr && document.getElementById('profile-trainer-qr-img')) {
        document.getElementById('profile-trainer-qr-img').src = localQr;
        document.getElementById('profile-trainer-qr-img').classList.remove('hidden');
        document.getElementById('profile-trainer-qr-icon').classList.add('hidden');
    }

    // Load from cloud
    await loadUserDataFromFirebase();
});
