import { ensureUserExists } from '../db/user.db'
import { deleteRating, getRating, upsertRating, type RatingRecord } from '../db/rating.db'
import { RatingNotFoundError, SelfRatingError } from '../errors/rating.errors'

// Creates or updates the rater's rating of another user. The unique
// (raterId, ratedId) constraint makes this idempotent, so there is no separate
// create/update path.
export const rateUser = async (
    raterId: bigint,
    ratedId: bigint,
    score: number,
): Promise<RatingRecord> => {
    if (raterId === ratedId) {
        throw new SelfRatingError()
    }

    // The rated user may have been rated without ever logging in; ensure their
    // users row exists before the rating's foreign key references it.
    await ensureUserExists(ratedId)

    return upsertRating(raterId, ratedId, score)
}

export const getMyRating = (
    raterId: bigint,
    ratedId: bigint,
): Promise<RatingRecord | null> => getRating(raterId, ratedId)

export const removeRating = async (
    raterId: bigint,
    ratedId: bigint,
): Promise<void> => {
    const { count } = await deleteRating(raterId, ratedId)

    if (count === 0) {
        throw new RatingNotFoundError()
    }
}
