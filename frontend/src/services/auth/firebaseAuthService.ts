/**
 * Firebase Authentication + Firestore users 컬렉션 기반 인증.
 * - 계정(이메일·비밀번호): Firebase Authentication
 * - 프로필(이름·소속기관): Firestore users/{uid}
 */
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";
import type { AuthService } from "@/services/types";
import type { User } from "@/types";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth/user-not-found": "등록되지 않은 이메일입니다.",
  "auth/wrong-password": "비밀번호가 올바르지 않습니다.",
  "auth/invalid-email": "올바른 이메일 형식이 아닙니다.",
  "auth/email-already-in-use": "이미 가입된 이메일입니다.",
  "auth/weak-password": "비밀번호는 6자 이상이어야 합니다.",
  "auth/too-many-requests": "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "auth/network-request-failed": "네트워크 연결을 확인해 주세요.",
  "auth/operation-not-allowed": "이메일/비밀번호 로그인이 활성화되지 않았습니다. (Firebase 콘솔 설정 필요)",
};

function toKoreanError(e: unknown): Error {
  if (e instanceof FirebaseError) return new Error(ERROR_MESSAGES[e.code] ?? `인증 오류가 발생했습니다. (${e.code})`);
  return e instanceof Error ? e : new Error("인증 오류가 발생했습니다.");
}

async function loadProfile(fbUser: FirebaseUser): Promise<User> {
  const snap = await getDoc(doc(firestore(), "users", fbUser.uid));
  const data = snap.data() as Omit<User, "uid"> | undefined;
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? data?.email ?? "",
    name: data?.name ?? fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "관리자",
    organization: data?.organization ?? "",
    createdAt: data?.createdAt ?? fbUser.metadata.creationTime ?? new Date().toISOString(),
  };
}

// 회원가입 직후 프로필 문서가 저장된 뒤 구독자에게 다시 알리기 위해 직접 관리한다.
const listeners = new Set<(user: User | null) => void>();
const emit = (user: User | null) => listeners.forEach((cb) => cb(user));

export const firebaseAuthService: AuthService = {
  async getCurrentUser() {
    const auth = firebaseAuth();
    await auth.authStateReady();
    return auth.currentUser ? loadProfile(auth.currentUser) : null;
  },

  onAuthStateChanged(callback) {
    listeners.add(callback);
    const unsubscribe = onFirebaseAuthStateChanged(firebaseAuth(), async (fbUser) => {
      callback(fbUser ? await loadProfile(fbUser).catch(() => null) : null);
    });
    return () => {
      listeners.delete(callback);
      unsubscribe();
    };
  },

  async signIn(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
      return await loadProfile(cred.user);
    } catch (e) {
      throw toKoreanError(e);
    }
  },

  async signUp(input) {
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth(), input.email.trim(), input.password);
      const user: User = {
        uid: cred.user.uid,
        name: input.name.trim(),
        organization: input.organization.trim(),
        email: input.email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
      };
      await updateProfile(cred.user, { displayName: user.name });
      const { uid, ...profile } = user;
      await setDoc(doc(firestore(), "users", uid), profile);
      emit(user);
      return user;
    } catch (e) {
      throw toKoreanError(e);
    }
  },

  async signOut() {
    await firebaseSignOut(firebaseAuth());
  },
};
