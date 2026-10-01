/**
 * TODO(firebase): Firebase Authentication 구현 자리.
 *
 * 1) npm i firebase
 * 2) src/lib/firebase.ts 에서 initializeApp(firebaseConfig) 후 auth, db, storage export
 * 3) 아래 메서드를 구현하고 services/index.ts 에서 mockAuthService 대신 연결
 *
 *   signIn:  signInWithEmailAndPassword(auth, email, password)
 *   signUp:  createUserWithEmailAndPassword → setDoc(doc(db, "users", uid), { name, organization, email, createdAt })
 *   onAuthStateChanged: onAuthStateChanged(auth, fbUser => getDoc(users/{uid}) → callback(User))
 *   signOut: signOut(auth)
 *
 * UI 컴포넌트는 AuthService interface 만 사용하므로 이 파일과 services/index.ts 외에는 수정할 필요가 없다.
 */
export {};
