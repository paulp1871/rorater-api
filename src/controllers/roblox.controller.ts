import type { RequestHandler } from 'express'
import type { SessionLocals } from '../middleware/auth.middleware'
import type { ValidatedParamsLocals, ValidatedQueryLocals } from '../middleware/validation.middleware'
import type { UserIdParam, UserSearchQuery } from '../schemas/roblox.schema'
import { getRobloxUserProfile, searchRobloxUsersWithAvatars } from '../services/roblox.service'

export const userSearchHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedQueryLocals<UserSearchQuery>
> = async (req, res, next) => {
    try {
        const response = await searchRobloxUsersWithAvatars(
            res.locals.validatedQuery,
        )
        res.json(response)
    } catch (error) {
        // Forward to robloxErrorHandler, which distinguishes Roblox rate limits
        // (429) from other upstream failures (502).
        next(error)
    }
}

export const userProfileHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    SessionLocals & ValidatedParamsLocals<UserIdParam>
> = async (req, res, next) => {
    try {
        const response = await getRobloxUserProfile(
            res.locals.validatedParams.id,
            res.locals.sessionId,
        )
        res.json(response)
    } catch (error) {
        // Forward to robloxErrorHandler, which distinguishes Roblox rate limits
        // (429) from other upstream failures (502).
        next(error)
    }
}
