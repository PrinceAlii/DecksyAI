-- CreateTable
CREATE TABLE "FeedbackPreference" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "trophiesWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "playstyleWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "difficultyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "preferArchetypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avoidArchetypes" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "FeedbackPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackPreference_userId_key" ON "FeedbackPreference"("userId");

-- AddForeignKey
ALTER TABLE "FeedbackPreference"
ADD CONSTRAINT "FeedbackPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
