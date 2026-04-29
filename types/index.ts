import { Timestamp } from "firebase/firestore";

export type Role = "admin" | "teacher" | "student";

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: Timestamp;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  tier: "official" | "community";
  createdBy: string;
  createdAt: Timestamp;
  published: boolean;
  templateId: string;

  bankSize: 125;
  bankGeneratedAt: Timestamp | null;
}

export interface Template {
  id: string;
  topicId: string;
  name: string;
  description: string;
  createdBy: string;
  tier: "official" | "community";
  code: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Question {
  index: number;
  templateId: string;
  prompt: string;
  promptType: "text" | "svg";
  answer: string;
  distractors: string[];
  type: "multiple-choice" | "free-response";
  explanation: {
    steps: string[];
    summary: string;
  };
  meta: Record<string, unknown>;
}

export interface ClassDoc {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  joinCode: string;
  createdAt: Timestamp;
}

export interface Assignment {
  id: string;
  name: string;
  classId: string;
  teacherId: string;
  topicIds: string[];
  topicWeights?: Record<string, number> | null; // Weights for each topicId (e.g. { topicId1: 1, topicId2: 2 })
  mixedMode: boolean;
  requiredCorrect: number;
  penalty: number;
  dueDate: Timestamp;
  createdAt: Timestamp;
  posted: boolean;
}

export interface QuestionLogEntry {
  questionIndex: number;
  selectedAnswer: string;
  correct: boolean;
  answeredAt: Timestamp;
}

export interface StudentProgress {
  userId: string;
  assignmentId: string;
  topicId: string;           // If mixed, can be "mixed" or the first topic. If separate, specific topicId.
  questionsAnswered: number;
  correctCount: number;
  incorrectCount: number;
  penalty?: number;
  completed: boolean;
  completedAt: Timestamp | null;
  lastActivityAt: Timestamp;
  questionLog: QuestionLogEntry[];
}
