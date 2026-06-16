-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "roblox_id" BIGINT NOT NULL,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("roblox_id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" BIGSERIAL NOT NULL,
    "rater_id" BIGINT NOT NULL,
    "rated_id" BIGINT NOT NULL,
    "score" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ratings_rated_id_created_at_idx" ON "ratings"("rated_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_rater_id_rated_id_key" ON "ratings"("rater_id", "rated_id");

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "users"("roblox_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rated_id_fkey" FOREIGN KEY ("rated_id") REFERENCES "users"("roblox_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Defense-in-depth CHECK constraints (Prisma cannot model these, so they live
-- here only). They mirror the app's Zod validation (score is an integer 1..5)
-- and the rating.service self-rating guard, so they should never fire on normal
-- traffic — only on a bug or a direct-SQL write.
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_score_range" CHECK ("score" BETWEEN 1 AND 5);
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_no_self_rating" CHECK ("rater_id" <> "rated_id");
