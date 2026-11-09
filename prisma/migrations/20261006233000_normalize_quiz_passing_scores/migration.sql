-- The application has always enforced a minimum passing score of 70%.
UPDATE "Quiz" SET "passingScore" = 70 WHERE "passingScore" < 70;
