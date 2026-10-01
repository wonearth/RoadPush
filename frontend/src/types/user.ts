/** 관리자 계정. Firestore `users` 컬렉션 문서에 대응한다. */
export interface User {
  uid: string;
  name: string;
  organization: string;
  email: string;
  createdAt: string;
}

export interface SignUpInput {
  name: string;
  organization: string;
  email: string;
  password: string;
}
