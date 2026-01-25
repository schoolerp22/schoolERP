import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCi3MYmTwrmsoc-7L6obxwi-Akac276ETk",
    authDomain: "schoolerp-ddc38.firebaseapp.com",
    projectId: "schoolerp-ddc38",
    storageBucket: "schoolerp-ddc38.firebasestorage.app",
    messagingSenderId: "921820914350",
    appId: "1:921820914350:web:968617c4b9dc3a905cc33f",
    measurementId: "G-Y8WG1Z8E90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
