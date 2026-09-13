/**
 * Seeds Firestore /topics from data/curriculum.ts.
 *
 * Idempotent: uses the subtopic id as the document id and merges, so re-running
 * updates names/descriptions without touching templateIds, weights, or bank state.
 *
 * After writing, it prunes curriculum-managed topics (those with a courseId) whose id is
 * no longer in the curriculum, but only when no template references them. Topics without
 * a courseId (legacy / community) are never touched.
 *
 * Run:  node scripts/seedTopics.ts            (Node 22.18+ strips types natively)
 *       node scripts/seedTopics.ts --dry-run  (print what would be written)
 */
import { readFileSync } from "node:fs";
import admin from "firebase-admin";
import { CURRICULUM, flattenCurriculum } from "../data/curriculum.ts";

const CURRICULUM_COURSE_IDS = CURRICULUM.map((c) => c.id);

const dryRun = process.argv.includes("--dry-run");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();
const adminUid = process.env.SEED_ADMIN_UID ?? "seed";

const rows = flattenCurriculum();
let unitCounter: Record<string, number> = {};
const batch = db.batch();

for (const { course, unit, subtopic } of rows) {
  unitCounter[unit.id] = (unitCounter[unit.id] ?? 0) + 1;
  const ref = db.collection("topics").doc(subtopic.id);
  const data = {
    name: subtopic.name,
    description: subtopic.description,
    tier: "official",
    courseId: course.id,
    courseName: course.name,
    unitId: unit.id,
    unitName: unit.name,
    order: unitCounter[unit.id],
    levelDescriptions: subtopic.levels,
    published: false,
    bankSize: 125,
  };
  const existing = await ref.get();
  if (!existing.exists) {
    Object.assign(data, {
      createdBy: adminUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      templateIds: [],
      weights: {},
      bankGeneratedAt: null,
    });
  }
  if (dryRun) {
    console.log(`${existing.exists ? "update" : "create"} ${subtopic.id}  ${course.name} › ${unit.name} › ${subtopic.name}`);
  } else {
    batch.set(ref, data, { merge: true });
  }
}

if (!dryRun) {
  await batch.commit();
}
console.log(`${dryRun ? "Would write" : "Wrote"} ${rows.length} topics.`);

// Prune curriculum-managed topics that no longer exist in the curriculum file.
const liveIds = new Set(rows.map((r) => r.subtopic.id));
const managed = await db.collection("topics").where("courseId", "in", CURRICULUM_COURSE_IDS).get();
const stale = managed.docs.filter((d) => !liveIds.has(d.id));
let pruned = 0;
for (const d of stale) {
  const refs = await db.collection("templates").where("topicId", "==", d.id).count().get();
  if (refs.data().count > 0) {
    console.log(`keep   ${d.id} (stale, but ${refs.data().count} template(s) reference it)`);
    continue;
  }
  if (dryRun) console.log(`prune  ${d.id}  ${d.data().name}`);
  else await d.ref.delete();
  pruned++;
}
console.log(`${dryRun ? "Would prune" : "Pruned"} ${pruned} stale topics.`);
