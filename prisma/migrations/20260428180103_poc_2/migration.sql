-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "price" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "geohash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "meditationStartedAt" DATETIME,
    "postponedUntil" DATETIME,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("createdAt", "description", "geohash", "id", "latitude", "longitude", "notes", "notificationSent", "photoUrl", "postponedUntil", "price", "status", "updatedAt", "userId") SELECT "createdAt", "description", "geohash", "id", "latitude", "longitude", "notes", "notificationSent", "photoUrl", "postponedUntil", "price", "status", "updatedAt", "userId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_userId_idx" ON "Item"("userId");
CREATE INDEX "Item_status_idx" ON "Item"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
