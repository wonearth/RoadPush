/**
 * Firebase 초기화.
 * 환경변수(.env.local / Vercel Environment Variables)가 모두 채워진 경우에만 사용한다.
 * 값이 없으면 services 계층이 mock 구현으로 동작한다.
 */
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// NEXT_PUBLIC_ 값은 빌드 시점에 번들에 인라인되므로 반드시 리터럴로 참조한다.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** 필수 설정값이 모두 있는지 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

function app(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase 환경변수가 설정되지 않았습니다. frontend/.env.example 을 참고하세요.");
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseAuth = (): Auth => getAuth(app());
let firestoreInstance: Firestore | null = null;

/** undefined 필드(예: 선택값)는 저장 시 자동으로 제외한다. */
export function firestore(): Firestore {
  if (!firestoreInstance) {
    const firebaseApp = app();
    try {
      firestoreInstance = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
    } catch {
      // 개발 서버 HMR 등으로 이미 초기화된 경우
      firestoreInstance = getFirestore(firebaseApp);
    }
  }
  return firestoreInstance;
}
export const firebaseStorage = (): FirebaseStorage => getStorage(app());
