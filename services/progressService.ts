import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StudentProgress, QuestionLogEntry } from "@/types";

export async function getProgress(
  userId: string,
  assignmentId: string
): Promise<StudentProgress | null> {
  const snap = await getDoc(doc(db, "studentProgress", userId, assignmentId, "data"));
  return snap.exists() ? (snap.data() as StudentProgress) : null;
}

export async function initProgress(
  userId: string,
  assignmentId: string,
  topicId: string
): Promise<void> {
  await setDoc(doc(db, "studentProgress", userId, assignmentId, "data"), {
    userId,
    assignmentId,
    topicId,
    questionsAnswered: 0,
    correctCount: 0,
    incorrectCount: 0,
    completed: false,
    completedAt: null,
    lastActivityAt: serverTimestamp(),
    questionLog: [],
  });
}

export async function recordAnswer(
  userId: string,
  assignmentId: string,
  entry: Omit<QuestionLogEntry, "answeredAt">,
  requiredCorrect: number,
  penalty: number = 0
): Promise<void> {
  const ref = doc(db, "studentProgress", userId, assignmentId, "data");
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const current = snap.data() as StudentProgress;
  // A wrong answer deducts `penalty` from the correct count, never below 0.
  const newCorrect = entry.correct
    ? current.correctCount + 1
    : Math.max(0, current.correctCount - penalty);
  const newIncorrect = current.incorrectCount + (entry.correct ? 0 : 1);
  const completed = newCorrect >= requiredCorrect;

  await updateDoc(ref, {
    questionsAnswered: current.questionsAnswered + 1,
    correctCount: newCorrect,
    incorrectCount: newIncorrect,
    completed,
    completedAt: completed ? serverTimestamp() : null,
    lastActivityAt: serverTimestamp(),
    questionLog: arrayUnion({ ...entry, answeredAt: serverTimestamp() }),
  });
}

export async function getProgressForAssignment(
  assignmentId: string
): Promise<StudentProgress[]> {
  const q = query(
    collection(db, "studentProgress"),
    where("assignmentId", "==", assignmentId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as StudentProgress);
}

export function subscribeToProgressForAssignment(
  assignmentId: string,
  callback: (progress: StudentProgress[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "studentProgress"),
    where("assignmentId", "==", assignmentId)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as StudentProgress));
  });
}

export async function getProgressForStudent(userId: string): Promise<StudentProgress[]> {
  const snap = await getDocs(collection(db, "studentProgress", userId));
  return snap.docs.map((d) => d.data() as StudentProgress);
}
