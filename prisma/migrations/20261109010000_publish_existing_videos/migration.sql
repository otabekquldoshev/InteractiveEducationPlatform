-- Older uploads were stored as unpublished even though the upload UI had no
-- separate video publishing control. Make those uploads visible consistently.
UPDATE "Video" SET "published" = true WHERE "published" = false;
