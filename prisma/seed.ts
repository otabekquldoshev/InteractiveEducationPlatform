import {
  PrismaClient,
  LessonType,
  PublishStatus,
  QuestionType,
  UserRole,
} from "@prisma/client"
import bcrypt from "bcryptjs"
import {
  DEMO_COURSES,
  DEMO_ENROLLMENTS,
  DEMO_MODULES,
  DEMO_QUIZZES,
  DEMO_TRANSCRIPTS,
  DEMO_USERS,
} from "../src/data/mockData.js"

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("demo", 12)

  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.toUpperCase() as UserRole,
        passwordHash,
      },
      create: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.toUpperCase() as UserRole,
        passwordHash,
        accessibilitySetupDone: user.accessibilitySetupDone,
        createdAt: new Date(user.createdAt),
      },
    })
  }

  for (const course of DEMO_COURSES) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        duration: course.duration,
        status: PublishStatus.PUBLISHED,
        teacherId: "u3",
      },
      create: {
        id: course.id,
        title: course.title,
        slug: `${course.id}-${course.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-+$/g, "")}`,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        duration: course.duration,
        status: PublishStatus.PUBLISHED,
        teacherId: "u3",
        rating: course.rating,
        createdAt: new Date(course.createdAt),
      },
    })
  }

  for (const module of DEMO_MODULES) {
    await prisma.module.upsert({
      where: { id: module.id },
      update: { title: module.title, order: module.order },
      create: {
        id: module.id,
        courseId: module.courseId,
        title: module.title,
        order: module.order,
      },
    })
    for (const lesson of module.lessons) {
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: {
          title: lesson.title,
          type: lesson.type.toUpperCase() as LessonType,
          order: lesson.order,
          status: PublishStatus.PUBLISHED,
        },
        create: {
          id: lesson.id,
          moduleId: module.id,
          title: lesson.title,
          content:
            lesson.type === "text"
              ? `${lesson.title} bo'yicha dars materiali.`
              : null,
          type: lesson.type.toUpperCase() as LessonType,
          order: lesson.order,
          status: PublishStatus.PUBLISHED,
        },
      })
      if (lesson.videoUrl) {
        await prisma.video.upsert({
          where: { lessonId: lesson.id },
          update: { title: lesson.title, videoUrl: lesson.videoUrl },
          create: {
            id: `v-${lesson.id}`,
            lessonId: lesson.id,
            title: lesson.title,
            videoUrl: lesson.videoUrl,
            mimeType: "video/mp4",
            size: BigInt(0),
            published: true,
          },
        })
      }
    }
  }

  const firstVideo = await prisma.video.findUnique({
    where: { lessonId: "l1" },
  })
  if (firstVideo) {
    const vtt = [
      "WEBVTT",
      "",
      ...DEMO_TRANSCRIPTS.map(
        (item, index) =>
          `${index + 1}\n00:00:${String(item.startTime).padStart(2, "0")}.000 --> 00:00:${String(item.endTime).padStart(2, "0")}.000\n${item.text}`,
      ),
    ].join("\n\n")
    await prisma.subtitle.upsert({
      where: {
        videoId_language: { videoId: firstVideo.id, language: "uz-UZ" },
      },
      update: { content: vtt },
      create: { videoId: firstVideo.id, language: "uz-UZ", content: vtt },
    })
  }

  for (const quiz of DEMO_QUIZZES) {
    await prisma.quiz.upsert({
      where: { id: quiz.id },
      update: { title: quiz.title, status: PublishStatus.PUBLISHED },
      create: {
        id: quiz.id,
        lessonId: quiz.lessonId,
        title: quiz.title,
        status: PublishStatus.PUBLISHED,
        questions: {
          create: quiz.questions.map((question, index) => ({
            id: question.id,
            text: question.text,
            type:
              question.type === "truefalse"
                ? QuestionType.TRUE_FALSE
                : question.type.toUpperCase() as QuestionType,
            options: question.options,
            correctAnswers: question.correctAnswers,
            explanation: question.explanation,
            order: index + 1,
          })),
        },
      },
    })
  }

  for (const enrollment of DEMO_ENROLLMENTS) {
    await prisma.enrollment.upsert({
      where: { id: enrollment.id },
      update: {
        progress: enrollment.progress,
        lastLessonId: enrollment.lastLessonId,
        lastActivityAt: new Date(enrollment.lastActivityAt),
      },
      create: {
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        progress: enrollment.progress,
        lastLessonId: enrollment.lastLessonId,
        enrolledAt: new Date(enrollment.enrolledAt),
        lastActivityAt: new Date(enrollment.lastActivityAt),
      },
    })
    for (const lessonId of enrollment.completedLessons) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: true },
      })
      if (lesson?.module.courseId === enrollment.courseId) {
        await prisma.lessonCompletion.upsert({
          where: {
            enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
          },
          update: {},
          create: { enrollmentId: enrollment.id, lessonId },
        })
      }
    }
  }

  console.log("Seed tayyor. Demo parol: demo")
}

main().finally(() => prisma.$disconnect())
