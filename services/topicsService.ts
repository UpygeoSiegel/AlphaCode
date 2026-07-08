import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Topic } from "@/types";

export async function getTopics(): Promise<Topic[]> {
  const snap = await getDocs(collection(db, "topics"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Topic));
}

export async function getPublishedTopics(): Promise<Topic[]> {
  const snap = await getDocs(collection(db, "topics"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Topic))
    .filter((t) => t.published === true);
}

export async function getTopic(topicId: string): Promise<Topic | null> {
  const snap = await getDoc(doc(db, "topics", topicId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Topic) : null;
}

export async function createTopic(
  data: Omit<Topic, "id" | "createdAt" | "bankGeneratedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "topics"), {
    ...data,
    createdAt: serverTimestamp(),
    bankGeneratedAt: null,
  });
  return ref.id;
}

export async function updateTopic(
  topicId: string,
  data: Partial<Omit<Topic, "id">>
): Promise<void> {
  await updateDoc(doc(db, "topics", topicId), data);
}

export async function deleteTopic(topicId: string): Promise<void> {
  await deleteDoc(doc(db, "topics", topicId));
}
