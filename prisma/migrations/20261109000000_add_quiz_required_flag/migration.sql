-- Published quizzes are optional unless an administrator explicitly marks them required.
ALTER TABLE "Quiz" ADD COLUMN "isRequired" BOOLEAN NOT NULL DEFAULT false;
