-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "assetId" TEXT,
    "signLanguageUrl" TEXT,
    "signLanguageAssetId" TEXT,
    "signLanguageMimeType" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "duration" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Video_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Video_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Video_signLanguageAssetId_fkey" FOREIGN KEY ("signLanguageAssetId") REFERENCES "MediaAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("assetId", "createdAt", "description", "duration", "id", "lessonId", "mimeType", "published", "size", "title", "updatedAt", "videoUrl") SELECT "assetId", "createdAt", "description", "duration", "id", "lessonId", "mimeType", "published", "size", "title", "updatedAt", "videoUrl" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE UNIQUE INDEX "Video_lessonId_key" ON "Video"("lessonId");
CREATE UNIQUE INDEX "Video_assetId_key" ON "Video"("assetId");
CREATE UNIQUE INDEX "Video_signLanguageAssetId_key" ON "Video"("signLanguageAssetId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
