importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD-OXJWKbcGkonKqvFtKfvgHxNQxLfsGCk",
  authDomain: "gen-lang-client-0480166612.firebaseapp.com",
  projectId: "gen-lang-client-0480166612",
  storageBucket: "gen-lang-client-0480166612.firebasestorage.app",
  messagingSenderId: "447223507341",
  appId: "1:447223507341:web:bc13a97134b4bceb11b5c4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const { title, body, image } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/logo-icon.png',
    image,
    badge: '/logo-icon.png',
    data: payload.data,
    actions: [
      { action: 'view', title: 'View Opportunity' }
    ]
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
