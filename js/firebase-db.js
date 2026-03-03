// firebase-db.js
// Firebase is loaded via CDN in index.html

const firebaseConfig = {
    // IMPORTANT: Replace this placeholder config with your actual Firebase Project config!
    // You can get this from your Firebase Console -> Project Settings -> General -> Web Apps
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase only if the user has provided a config
let db = null;
let storage = null;
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

if (isFirebaseConfigured) {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        storage = firebase.storage();
        console.log("Firebase initialized successfully");
    } catch (e) {
        console.warn("Firebase initialization failed. Using LocalStorage fallback.", e);
    }
} else {
    console.warn("Firebase config is missing. Using LocalStorage fallback. Please update firebase-db.js with your config.");
}

// Ensure we have a persistent User ID
let currentUserId = localStorage.getItem('trainer_user_id');
if (!currentUserId) {
    currentUserId = 'trainer_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('trainer_user_id', currentUserId);
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

    // Overwrite with fresh cloud data if Firebase is configured
    if (db) {
        try {
            const doc = await db.collection("trainers").doc(currentUserId).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.avatarUrl) {
                    document.getElementById('profile-trainer-avatar-img').src = data.avatarUrl;
                    document.getElementById('profile-trainer-avatar-img').classList.remove('hidden');
                    document.getElementById('profile-trainer-avatar-icon').classList.add('hidden');
                }
                if (data.qrUrl) {
                    document.getElementById('profile-trainer-qr-img').src = data.qrUrl;
                    document.getElementById('profile-trainer-qr-img').classList.remove('hidden');
                    document.getElementById('profile-trainer-qr-icon').classList.add('hidden');
                }
            }
        } catch (error) {
            console.error("Error fetching trainer doc from Firebase", error);
        }
    }
});
