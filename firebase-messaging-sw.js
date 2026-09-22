// Firebase Messaging Service Worker

importScripts(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);


// Your Firebase Configuration

firebase.initializeApp({

apiKey:
"AIzaSyDAbHsV-S363u-sGCBo3m1O7YLEaFAa4e8",

authDomain:
"skyrent-ea30c.firebaseapp.com",

projectId:
"skyrent-ea30c",

storageBucket:
"skyrent-ea30c.firebasestorage.app",

messagingSenderId:
"572678456448",

appId:
"1:572678456448:web:6b7132351515742dd09265"

});


const messaging =
firebase.messaging();


// Background notification

messaging.onBackgroundMessage(
function(payload){

console.log(
"Background message received:",
payload
);


const notificationTitle =
payload.notification.title ||
"SkyRent Admin";


const notificationOptions = {

body:
payload.notification.body ||
"New SkyRent update",

icon:
"/skyrent.png",

badge:
"/skyrent.png",

};


self.registration.showNotification(
notificationTitle,
notificationOptions
);


});
