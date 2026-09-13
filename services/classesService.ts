import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ClassDoc } from "@/types";

export async function getTeacherClasses(teacherId: string): Promise<ClassDoc[]> {
  const q = query(
    collection(db, "classes"), 
    where("teacherId", "==", teacherId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassDoc));
}

export async function getClass(classId: string): Promise<ClassDoc | null> {
  const snap = await getDoc(doc(db, "classes", classId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ClassDoc) : null;
}

export async function getClassByJoinCode(joinCode: string): Promise<ClassDoc | null> {
  const q = query(collection(db, "classes"), where("joinCode", "==", joinCode.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as ClassDoc;
}

export async function createClass(teacherId: string, name: string): Promise<string> {
  // Generate a random 6-character join code
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const ref = await addDoc(collection(db, "classes"), {
    name,
    teacherId,
    joinCode,
    studentIds: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function archiveClass(classId: string): Promise<void> {
  await updateDoc(doc(db, "classes", classId), { archived: true });
}

export async function unarchiveClass(classId: string): Promise<void> {
  await updateDoc(doc(db, "classes", classId), { archived: false });
}

export async function deleteClass(classId: string): Promise<void> {
  await deleteDoc(doc(db, "classes", classId));
}

export async function addStudentToClass(classId: string, studentId: string): Promise<void> {
  const classRef = doc(db, "classes", classId);
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Class not found");
  
  const data = classSnap.data();
  const studentIds = (data.studentIds as string[]) || [];
  
  if (!studentIds.includes(studentId)) {
    await updateDoc(classRef, {
      studentIds: [...studentIds, studentId]
    });
  }
}
