import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question } from "@/types";

export async function getQuestionBank(topicId: string): Promise<Question[]> {
  const snap = await getDocs(
    collection(db, "questionBanks", topicId, "questions")
  );
  return snap.docs.map((d) => d.data() as Question);
}
