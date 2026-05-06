import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

const topics = [
  {
    id: "AAP-1.1",
    name: "Variables & Assignment",
    description: "Tracing values, the ← operator, and updating variables in AP Pseudocode.",
    cspCategory: "variables-assignments"
  },
  {
    id: "AAP-1.2",
    name: "Data Abstraction (Lists)",
    description: "Accessing elements with 1-based indexing and understanding list length.",
    cspCategory: "data-abstraction"
  },
  {
    id: "AAP-1.3",
    name: "Mathematical Expressions",
    description: "Arithmetic order of operations and the MOD operator.",
    cspCategory: "mathematical-expressions"
  },
  {
    id: "AAP-1.4",
    name: "Strings & Concatenation",
    description: "Joining text, substrings, and understanding string length.",
    cspCategory: "strings"
  },
  {
    id: "AAP-2.1",
    name: "Conditionals & Logic",
    description: "IF/ELSE statements, AND/OR/NOT, and relational operators.",
    cspCategory: "conditionals"
  },
  {
    id: "AAP-2.2",
    name: "Iteration (Loops)",
    description: "REPEAT n TIMES, REPEAT UNTIL, and tracing loop variables.",
    cspCategory: "iteration"
  },
  {
    id: "AAP-2.3",
    name: "List Operations",
    description: "INSERT, APPEND, REMOVE, and searching lists in AP Pseudocode.",
    cspCategory: "lists"
  },
  {
    id: "AAP-3.1",
    name: "Procedure Calls",
    description: "Understanding parameters, arguments, and return values.",
    cspCategory: "calling-procedures"
  },
  {
    id: "AAP-3.2",
    name: "Algorithmic Efficiency",
    description: "Comparing runtime between Linear and Binary search.",
    cspCategory: "algorithmic-efficiency"
  },
  {
    id: "AAP-3.3",
    name: "Randomness & Simulation",
    description: "Generating values with RANDOM(a, b) and modeling real-world events.",
    cspCategory: "random-values"
  }
];

async function seed() {
  console.log("Starting topic seed...");
  try {
    const batch = db.batch();
    
    for (const topic of topics) {
      const { id, ...data } = topic;
      const ref = db.collection("topics").doc(id);
      batch.set(ref, {
        ...data,
        tier: "official",
        createdBy: "system",
        createdAt: FieldValue.serverTimestamp(),
        published: true,
        templateId: "",
        bankSize: 125,
        bankGeneratedAt: null
      });
      console.log(`Queued topic: ${id}`);
    }
    
    await batch.commit();
    console.log("Successfully seeded all topics!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding topics:", err);
    process.exit(1);
  }
}

seed();
