import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAKCBL2Pq543r64pCVsH9JVeROY3xPFEqJ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'itsm-faculdade.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'itsm-faculdade',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'itsm-faculdade.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '927158121462',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:927158121462:web:0b1e80cab0766547904dd7'
});
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export async function autenticarComGoogle(): Promise<{ idToken: string; nome: string }> {
  const resultado = await signInWithPopup(auth, provider);
  return { idToken: await resultado.user.getIdToken(), nome: resultado.user.displayName ?? resultado.user.email ?? 'Aluno' };
}
