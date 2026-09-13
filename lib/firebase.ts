import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function getFirebaseApp(): FirebaseApp {
  const apps = getApps();
  if (apps.length) return apps[0];
  return initializeApp(firebaseConfig);
}

export function getClientAuth(): Auth {
  const apps = getApps();
  if (typeof window !== "undefined" && apps.length === 0) {
    const app = initializeApp(firebaseConfig);
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  }
  return getAuth(getFirebaseApp());
}

export function getClientDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export const auth = typeof window !== "undefined" ? getClientAuth() : ({} as Auth);
export const db = typeof window !== "undefined" ? getClientDb() : ({} as Firestore);
