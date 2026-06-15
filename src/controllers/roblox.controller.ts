import type { RequestHandler } from 'express'
import type { ValidatedParamsLocals, ValidatedQueryLocals } from '../middleware/validation.middleware'
import type { UserIdParam, UserSearchQuery } from '../schemas/roblox.schema'
import { getRobloxUserProfile, searchRobloxUsersWithAvatars } from '../services/roblox.service'

export const userSearchHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedQueryLocals<UserSearchQuery>
> = async (req, res) => {
    try {
        const response = await searchRobloxUsersWithAvatars(
            res.locals.validatedQuery,
        )
        res.json(response)
    } catch (error) {
        console.error('Roblox user search failed', error)
        res.status(502).json({ message: 'Unable to search Roblox users' })
    }
}

export const userProfileHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedParamsLocals<UserIdParam>
> = async (req, res) => {
    try {
        const response = await getRobloxUserProfile(res.locals.validatedParams.id)
        res.json(response)
    } catch (error) {
        console.error('Roblox user profile fetch failed', error)
        res.status(502).json({ message: 'Unable to fetch Roblox user profile' })
    }
}
