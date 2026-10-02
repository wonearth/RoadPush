/**
 * ⚠️ 개발용 MOCK 인증.
 * TODO(firebase): firebaseAuthService.ts 로 교체
 *   - signIn  → signInWithEmailAndPassword
 *   - signUp  → createUserWithEmailAndPassword + Firestore users/{uid} 문서 생성
 *   - onAuthStateChanged → firebase/auth onAuthStateChanged
 */
import { createId } from "@/lib/id";
import { delay } from "@/lib/delay";
import type { AuthService } from "@/services/types";
import type { User } from "@/types";
import { mockDb } from "../mock/mockDb";

const SESSION_KEY = "roadpush.mock.session";
const listeners = new Set<(user: User | null) => void>();

function readSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function setSession(user: User | null) {
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(SESSION_KEY);
  listeners.forEach((cb) => cb(user));
}

function toUser({ uid, name, organization, email, createdAt }: User): User {
  return { uid, name, organization, email, createdAt };
}

export const mockAuthService: AuthService = {
  async getCurrentUser() {
    return readSession();
  },

  onAuthStateChanged(callback) {
    listeners.add(callback);
    callback(readSession());
    return () => listeners.delete(callback);
  },

  async signIn(email, password) {
    await delay(500);
    const record = mockDb.read().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!record) throw new Error("등록되지 않은 이메일입니다.");
    if (record.password !== password) throw new Error("비밀번호가 올바르지 않습니다.");
    const user = toUser(record);
    setSession(user);
    return user;
  },

  async signUp(input) {
    await delay(600);
    const email = input.email.trim().toLowerCase();
    const user = mockDb.write((db) => {
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        throw new Error("이미 가입된 이메일입니다.");
      }
      const record = {
        uid: createId("mock-user"),
        name: input.name.trim(),
        organization: input.organization.trim(),
        email,
        password: input.password,
        createdAt: new Date().toISOString(),
      };
      db.users.push(record);
      return toUser(record);
    });
    setSession(user);
    return user;
  },

  async signOut() {
    setSession(null);
  },

  async changePassword(currentPassword, newPassword) {
    await delay(400);
    const session = readSession();
    mockDb.write((db) => {
      const record = db.users.find((u) => u.uid === session?.uid);
      if (!record) throw new Error("로그인이 필요합니다.");
      if (record.password !== currentPassword) throw new Error("현재 비밀번호가 올바르지 않습니다.");
      record.password = newPassword;
    });
  },

  async deleteAccount(password) {
    await delay(400);
    const session = readSession();
    mockDb.write((db) => {
      const record = db.users.find((u) => u.uid === session?.uid);
      if (!record) throw new Error("로그인이 필요합니다.");
      if (record.password !== password) throw new Error("비밀번호가 올바르지 않습니다.");
      db.users = db.users.filter((u) => u.uid !== record.uid);
    });
    setSession(null);
  },
};
