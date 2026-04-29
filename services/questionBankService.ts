import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question } from "@/types";

export async function getQuestionBank(topicId: string): Promise<Question[]> {
  const snap = await getDocs(
    collection(db, "questionBanks", topicId, "questions")
  );
  return snap.docs.map((d) => d.data() as Question);
}

export async function deleteQuestionBank(topicId: string): Promise<void> {
  const snap = await getDocs(
    collection(db, "questionBanks", topicId, "questions")
  );
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
