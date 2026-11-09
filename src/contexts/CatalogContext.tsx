import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Course, Module } from "../types"
import { api } from "../lib/api"

interface CatalogContextValue {
  courses: Course[]
  modules: Module[]
  isLoading: boolean
  error: string
  reload: () => Promise<void>
}

type CourseWithModules = Course & { modules?: Module[] }
const CatalogContext = createContext<CatalogContextValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await api<{ courses: Course[] }>("/courses")
      const loadCourse = async (summary: CourseWithModules) => {
        try {
          return (
            await api<{ course: CourseWithModules }>(`/courses/${summary.id}`)
          ).course
        } catch {
          // Backend hot-reload yoki qisqa tarmoq uzilishida bo‘sh summaryni
          // haqiqiy kurs deb ko‘rsatmasdan, bir marta qayta urinib ko‘ramiz.
          await new Promise((resolve) => window.setTimeout(resolve, 300))
          return (
            await api<{ course: CourseWithModules }>(`/courses/${summary.id}`)
          ).course
        }
      }
      const details = await Promise.all(
        list.courses.map((summary) => loadCourse(summary)),
      )
      setCourses(details)
      setModules(details.flatMap((course) => course.modules || []))
      setError("")
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Fanlarni yuklab bo'lmadi",
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])
  return (
    <CatalogContext.Provider
      value={{ courses, modules, isLoading, error, reload }}
    >
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context)
    throw new Error("useCatalog must be used inside CatalogProvider")
  return context
}
