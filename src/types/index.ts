export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  accessibilitySetupDone: boolean;
  createdAt: string;
}

export interface AccessibilityPreferences {
  fontSize: number; // 80-150 (percent)
  highContrast: boolean;
  darkMode: boolean;
  reducedMotion: boolean;
  dyslexiaFont: boolean;
  lineSpacing: number; // 1-2.5
  letterSpacing: number; // 0-5 (px)
  largeButtons: boolean;
  focusIndicator: boolean;
  keyboardNavigation: boolean;
  alwaysShowSubtitles: boolean;
  textToSpeech: boolean;
  speechRate: number; // 0.5-2
}

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  category: string;
  level: "boshlangich" | "orta" | "yuqori";
  thumbnail: string;
  duration: string;
  lessonsCount: number;
  modulesCount: number;
  hasSubtitles: boolean;
  hasAudio: boolean;
  hasTranscript: boolean;
  enrolledCount: number;
  rating: number;
  createdAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: "video" | "text" | "quiz";
  duration?: string;
  order: number;
  videoUrl?: string;
  content?: string;
  completed?: boolean;
}

export interface TranscriptSegment {
  id: string;
  startTime: number; // seconds
  endTime: number;
  text: string;
}

export interface Subtitle {
  id: string;
  lessonId: string;
  language: string;
  languageCode: string;
  segments: TranscriptSegment[];
}

export interface Question {
  id: string;
  text: string;
  type: "single" | "multiple" | "truefalse";
  options: { id: string; text: string }[];
  correctAnswers: string[];
  explanation?: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  moduleId: string;
  title: string;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string[]>;
  score: number;
  total: number;
  completedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number; // 0-100
  completedLessons: string[];
  lastLessonId?: string;
  lastActivityAt: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}
