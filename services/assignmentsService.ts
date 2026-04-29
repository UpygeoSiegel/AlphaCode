import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Assignment, ClassDoc } from "@/types";

export async function getAssignment(assignmentId: string): Promise<Assignment | null> {
  const snap = await getDoc(doc(db, "assignments", assignmentId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Assignment) : null;
}

export async function getAssignmentsByClass(classId: string): Promise<Assignment[]> {
  const q = query(collection(db, "assignments"), where("classId", "==", classId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
}

export async function getPostedAssignmentsForStudent(
  classIds: string[]
): Promise<Assignment[]> {
  console.log("Querying assignments (LENIENT) for classIds:", classIds);
  if (classIds.length === 0) return [];
  const q = query(
    collection(db, "assignments"),
    where("classId", "in", classIds)
    // Temporarily removed: where("posted", "==", true)
  );
  const snap = await getDocs(q);
  console.log("Raw snapshot size:", snap.size);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
}

export async function createAssignment(
  data: Omit<Assignment, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "assignments"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAssignment(
  assignmentId: string,
  data: Partial<Omit<Assignment, "id">>
): Promise<void> {
  await updateDoc(doc(db, "assignments", assignmentId), data);
}

export async function getClass(classId: string): Promise<ClassDoc | null> {
  const snap = await getDoc(doc(db, "classes", classId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ClassDoc) : null;
}

export async function getClassesByTeacher(teacherId: string): Promise<ClassDoc[]> {
  const q = query(collection(db, "classes"), where("teacherId", "==", teacherId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassDoc));
}

export async function getClassesForStudent(userId: string): Promise<ClassDoc[]> {
  console.log("Searching for classes where studentIds contains:", userId);
  const q = query(
    collection(db, "classes"),
    where("studentIds", "array-contains", userId)
  );
  const snap = await getDocs(q);
  console.log("Found classes count:", snap.size);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassDoc));
}

export async function createClass(
  data: Omit<ClassDoc, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "classes"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
