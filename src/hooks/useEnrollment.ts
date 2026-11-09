import { useCallback, useEffect, useState } from "react"
import type { Enrollment } from "../types"
import { api } from "../lib/api"

export function useEnrollment(userId?: string) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    if (!userId) {
      setEnrollments([])
      return
    }
    setIsLoading(true)
    try {
      const result = await api<{ enrollments: Enrollment[] }>(
        "/learning/enrollments",
      )
      setEnrollments(result.enrollments)
      setError("")
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Progressni yuklab bo'lmadi",
      )
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  const enroll = useCallback(
    async (courseId: string) => {
      if (!userId) return
      try {
        const result = await api<{ enrollment: Enrollment }>(
          "/learning/enrollments",
          { method: "POST", body: { courseId } },
        )
        setEnrollments((current) => [
          ...current.filter((item) => item.courseId !== courseId),
          result.enrollment,
        ])
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Fanga yozilib bo'lmadi",
        )
      }
    },
    [userId],
  )

  const completeLesson = useCallback(
    async (courseId: string, lessonId: string, _totalLessons: number) => {
      if (!userId) return undefined
      try {
        const result = await api<{ enrollment: Enrollment }>(
          `/learning/enrollments/${courseId}/lessons/${lessonId}/complete`,
          { method: "POST" },
        )
        setEnrollments((current) =>
          current.map((item) =>
            item.courseId === courseId ? result.enrollment : item,
          ),
        )
        return result.enrollment
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Progressni saqlab bo'lmadi",
        )
        return undefined
      }
    },
    [userId],
  )

  const getEnrollment = useCallback(
    (courseId: string) =>
      enrollments.find((item) => item.courseId === courseId),
    [enrollments],
  )
  return {
    enrollments,
    enroll,
    completeLesson,
    getEnrollment,
    isLoading,
    error,
    reload,
  }
}
