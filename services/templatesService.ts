import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Template } from "@/types";

export async function getTemplate(templateId: string): Promise<Template | null> {
  const snap = await getDoc(doc(db, "templates", templateId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Template) : null;
}

export async function getTemplatesByTopic(topicId: string): Promise<Template[]> {
  const q = query(collection(db, "templates"), where("topicId", "==", topicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
}

export async function createTemplate(
  data: Omit<Template, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "templates"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTemplate(
  templateId: string,
  data: Partial<Omit<Template, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "templates", templateId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await deleteDoc(doc(db, "templates", templateId));
}

export async function deleteTemplatesByTopic(topicId: string): Promise<void> {
  const q = query(collection(db, "templates"), where("topicId", "==", topicId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
