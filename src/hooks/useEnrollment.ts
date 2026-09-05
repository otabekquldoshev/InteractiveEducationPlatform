import { useState, useEffect, useCallback } from "react";
import type { Enrollment } from "../types";
import { DEMO_ENROLLMENTS } from "../data/mockData";

const STORAGE_KEY = "edu_enrollments";

function load(): Enrollment[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_ENROLLMENTS));
  return DEMO_ENROLLMENTS;
}

function save(list: Enrollment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useEnrollment(userId?: string) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    const all = load();
    setEnrollments(userId ? all.filter((e) => e.userId === userId) : all);
  }, [userId]);

  const enroll = useCallback(
    (courseId: string) => {
      if (!userId) return;
      const all = load();
      if (all.find((e) => e.userId === userId && e.courseId === courseId)) return;
      const newE: Enrollment = {
        id: `e${Date.now()}`,
        userId,
        courseId,
        enrolledAt: new Date().toISOString().split("T")[0],
        progress: 0,
        completedLessons: [],
        lastActivityAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...all, newE];
      save(updated);
      setEnrollments(updated.filter((e) => e.userId === userId));
    },
    [userId]
  );

  const completeLesson = useCallback(
    (courseId: string, lessonId: string, totalLessons: number) => {
      if (!userId) return;
      const all = load();
      const updated = all.map((e) => {
        if (e.userId !== userId || e.courseId !== courseId) return e;
        const completed = e.completedLessons.includes(lessonId)
          ? e.completedLessons
          : [...e.completedLessons, lessonId];
        return {
          ...e,
          completedLessons: completed,
          lastLessonId: lessonId,
          progress: Math.round((completed.length / totalLessons) * 100),
          lastActivityAt: new Date().toISOString().split("T")[0],
        };
      });
      save(updated);
      setEnrollments(updated.filter((e) => e.userId === userId));
    },
    [userId]
  );

  const getEnrollment = useCallback(
    (courseId: string) => enrollments.find((e) => e.courseId === courseId),
    [enrollments]
  );

  return { enrollments, enroll, completeLesson, getEnrollment };
}
