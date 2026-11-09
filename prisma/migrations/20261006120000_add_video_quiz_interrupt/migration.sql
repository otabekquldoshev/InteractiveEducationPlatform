-- Add an optional in-video checkpoint time to lesson quizzes.
ALTER TABLE "Quiz" ADD COLUMN "interruptAtSeconds" INTEGER;
