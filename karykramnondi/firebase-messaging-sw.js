importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCNF-MyRZjVJ7caQbwFMWrb5cbJKPLvu5E",
  authDomain: "om-karmyog.firebaseapp.com",
  projectId: "om-karmyog",
  storageBucket: "om-karmyog.firebasestorage.app",
  messagingSenderId: "115489306172",
  appId: "1:115489306172:web:44ba73f0722d4208347539"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png"
  });
});
