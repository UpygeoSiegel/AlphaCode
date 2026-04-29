import { doc, getDoc, setDoc, serverTimestamp, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserDoc, Role } from "@/types";

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function getUsers(uids: string[]): Promise<UserDoc[]> {
  if (uids.length === 0) return [];
  // Firestore IN query limit is 30, but for now this is fine
  const q = query(collection(db, "users"), where("uid", "in", uids));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserDoc);
}

export async function createUser(
  uid: string,
  email: string,
  displayName: string,
  role: Role
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
  });
}
