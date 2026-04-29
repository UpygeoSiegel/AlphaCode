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
  assignmentId: string,
  topicId: string = "default"
): Promise<StudentProgress | null> {
  const snap = await getDoc(doc(db, "studentProgress", userId, assignmentId, topicId));
  return snap.exists() ? (snap.data() as StudentProgress) : null;
}

export async function initProgress(
  userId: string,
  assignmentId: string,
  topicId: string,
  penalty: number = 0
): Promise<void> {
  await setDoc(doc(db, "studentProgress", userId, assignmentId, topicId), {
    userId,
    assignmentId,
    topicId,
    questionsAnswered: 0,
    correctCount: 0,
    incorrectCount: 0,
    penalty,
    completed: false,
    completedAt: null,
    lastActivityAt: serverTimestamp(),
    questionLog: [],
  });
}

export async function recordAnswer(
  userId: string,
  assignmentId: string,
  topicId: string,
  entry: Omit<QuestionLogEntry, "answeredAt">,
  requiredCorrect: number,
  penalty: number = 0
): Promise<void> {
  const ref = doc(db, "studentProgress", userId, assignmentId, topicId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const current = snap.data() as StudentProgress;
  let newCorrect = current.correctCount;
  let newIncorrect = current.incorrectCount;

  if (entry.correct) {
    newCorrect += 1;
  } else {
    newIncorrect += 1;
    // Penalty logic: subtract from correctCount but don't go below 0
    newCorrect = Math.max(0, newCorrect - penalty);
  }
  
  const completed = newCorrect >= requiredCorrect;

  await updateDoc(ref, {
    questionsAnswered: current.questionsAnswered + 1,
    correctCount: newCorrect,
    incorrectCount: newIncorrect,
    completed,
    completedAt: completed ? serverTimestamp() : null,
    lastActivityAt: serverTimestamp(),
    questionLog: arrayUnion({ ...entry, answeredAt: new Date() }),
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
