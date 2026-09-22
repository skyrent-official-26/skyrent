importScripts(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);


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



messaging.onBackgroundMessage(
(payload)=>{


console.log(
"Background notification received:",
payload
);



const notificationTitle =
payload.notification.title;



const notificationOptions = {

body:
payload.notification.body,

icon:
"/skyrent.png"

};



self.registration.showNotification(

notificationTitle,

notificationOptions

);


});
