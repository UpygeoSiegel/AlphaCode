import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { uid, role } = await request.json();

    if (!uid || !role) {
      return NextResponse.json({ error: "Missing uid or role" }, { status: 400 });
    }

    await getAdminAuth().setCustomUserClaims(uid, { role });
    await getAdminDb().collection("users").doc(uid).update({ role });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting user role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
