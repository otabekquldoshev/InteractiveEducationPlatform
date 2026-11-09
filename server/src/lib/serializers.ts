import type { Course, User } from "@prisma/client"

export function publicUser(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
    role: user.role.toLowerCase(),
    active: user.active,
    avatar: user.avatarUrl,
    accessibilitySetupDone: user.accessibilitySetupDone,
    createdAt: user.createdAt.toISOString().slice(0, 10),
  }
}

export function courseDto(
  course: Course & {
    teacher?: Pick<User, "firstName" | "lastName">
    modules?: Array<{ lessons: unknown[] }>
    _count?: { enrollments: number; ratings?: number }
  },
) {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    detailedContent: course.detailedContent,
    thumbnail: course.thumbnail || "",
    category: course.category,
    level: course.level,
    duration: course.duration || "",
    status: course.status.toLowerCase(),
    teacherId: course.teacherId,
    teacherName: course.teacher
      ? `${course.teacher.firstName} ${course.teacher.lastName}`
      : "",
    rating: course.rating,
    ratingsCount: course._count?.ratings || 0,
    enrolledCount: course._count?.enrollments || 0,
    modulesCount: course.modules?.length || 0,
    lessonsCount:
      course.modules?.reduce((total, item) => total + item.lessons.length, 0) ||
      0,
    hasSubtitles: false,
    hasAudio: false,
    hasTranscript: false,
    createdAt: course.createdAt.toISOString().slice(0, 10),
  }
}
