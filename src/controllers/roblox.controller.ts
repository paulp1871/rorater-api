import type { RequestHandler } from 'express'
import type { ValidatedQueryLocals } from '../middleware/validation.middleware'
import type { UserSearchQuery } from '../schemas/roblox.schema'
import { searchRobloxUsersWithAvatars } from '../services/roblox.service'

export const userSearchHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedQueryLocals<UserSearchQuery>
> = async (_req, res) => {
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
