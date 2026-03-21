// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
// @ts-ignore
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyCeBDhY7SOvsmfcTmxi5Ra-qOZGtLrJApM",
    authDomain: "our-harvest-tote.firebaseapp.com",
    projectId: "our-harvest-tote",
    storageBucket: "our-harvest-tote.firebasestorage.app",
    messagingSenderId: "703119370454",
    appId: "1:703119370454:web:e27f87706d213ff30d4177",
    measurementId: "G-YEVS64C84N"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

console.log("Firebase initialized from module");
