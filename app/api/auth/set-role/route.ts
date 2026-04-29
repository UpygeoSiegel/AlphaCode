import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { uid, role } = await request.json();

    if (!uid || !role) {
      return NextResponse.json({ error: "Missing uid or role" }, { status: 400 });
    }

    // 1. Set the Custom Claim on the Auth User (The "Security" part)
    await adminAuth.setCustomUserClaims(uid, { role });

    // 2. Update the Firestore document (The "Data" part)
    await adminDb.collection("users").doc(uid).update({ role });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting user role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
