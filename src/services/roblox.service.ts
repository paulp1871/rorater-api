import {
    getUserAvatar3dFromRoblox,
    getUserAvatarDetailsFromRoblox,
    getUserAvatarsFromRoblox,
    getUserInfoFromRoblox,
    searchUsersFromRoblox,
} from '../clients/roblox.client'
import { getUserRatingStats } from '../db/user.db'
import type { UserSearchQuery } from '../schemas/roblox.schema'
import { getValidAccessToken } from './token.service'
import {
    PROFILE_TTL,
    SEARCH_TTL,
    profileCacheKey,
    searchCacheKey,
    withCache,
} from '../stores/roblox.cache'

const USER_SEARCH_LIMIT = 25

type AvatarData = Awaited<ReturnType<typeof getUserAvatarsFromRoblox>>['data'][number]

type Thumbnail = { url: string | null; state: string } | null

type SearchResult = {
    users: {
        id: number
        username: string
        displayName: string
        hasVerifiedBadge: boolean
        previousUsernames: string[]
        avatar: Thumbnail
    }[]
}

type UserProfile = {
    id: number
    username: string
    displayName: string
    avatar: Thumbnail
    avatar3d: Thumbnail
    currentlyWearing: {
        id: number
        name: string
        assetType: { id: number; name: string }
    }[]
    averageRating: number | null
    mostRecentRating: { score: number; createdAt: string } | null
}

// The slow-moving, Roblox-sourced portion of a profile. This is what gets
// cached; rating stats are merged on top per request (see getRobloxUserProfile).
type RobloxProfileData = Omit<UserProfile, 'averageRating' | 'mostRecentRating'>

const formatAvatar = (avatar: AvatarData | null | undefined): Thumbnail => {
    if (!avatar) return null
    return {
        url: avatar.state === 'Completed' ? avatar.imageUrl : null,
        state: avatar.state,
    }
}

export const searchRobloxUsersWithAvatars = ({ keyword }: UserSearchQuery): Promise<SearchResult> =>
    withCache(searchCacheKey(keyword), SEARCH_TTL, async () => {
        const searchResponse = await searchUsersFromRoblox(keyword, USER_SEARCH_LIMIT)

        if (searchResponse.data.length === 0) {
            return { users: [] }
        }

        const avatarResponse = await getUserAvatarsFromRoblox(
            searchResponse.data.map((user) => user.id),
        )
        const avatarsByUserId = new Map(
            avatarResponse.data.map((avatar) => [avatar.targetId, avatar]),
        )

        return {
            users: searchResponse.data.map((user) => ({
                id: user.id,
                username: user.name,
                displayName: user.displayName,
                hasVerifiedBadge: user.hasVerifiedBadge,
                previousUsernames: user.previousUsernames,
                avatar: formatAvatar(avatarsByUserId.get(user.id)),
            })),
        }
    })

export const getRobloxUserProfile = async (userId: number, sessionId: string): Promise<UserProfile> => {
    // validate the session's token before serving any cached data 
    const accessToken = await getValidAccessToken(sessionId)

    // Rating stats change on every rating write, so they are fetched fresh per
    // request and merged onto the cached Roblox data below. Keeping them out of
    // the cached blob means a new rating is reflected immediately, with no
    // invalidation hook for the rating-write path to remember to call.
    const [robloxProfile, ratingStats] = await Promise.all([
        withCache(profileCacheKey(userId), PROFILE_TTL, async (): Promise<RobloxProfileData> => {
            // Phase 1: all token-independent calls run simultaneously
            const [userInfo, avatarThumbnail, avatarDetails] = await Promise.all([
                getUserInfoFromRoblox(userId),
                getUserAvatarsFromRoblox([userId]),
                getUserAvatarDetailsFromRoblox(userId),
            ])

            // Phase 2: token-gated call, now that the token is known. The 3D
            // avatar thumbnail is optional, and this endpoint can reject the
            // OAuth bearer (401/403). Don't let that sink the whole profile —
            // degrade to a null avatar3d and serve the rest.
            const avatar3d = await getUserAvatar3dFromRoblox(userId, accessToken).catch(() => null)

            return {
                id: userInfo.id,
                username: userInfo.name,
                displayName: userInfo.displayName,
                avatar: formatAvatar(avatarThumbnail.data[0]),
                avatar3d: formatAvatar(avatar3d),
                currentlyWearing: avatarDetails.assets.map((asset) => ({
                    id: asset.id,
                    name: asset.name,
                    assetType: asset.assetType,
                })),
            }
        }),
        getUserRatingStats(BigInt(userId)),
    ])

    return {
        ...robloxProfile,
        averageRating: ratingStats.averageRating,
        mostRecentRating: ratingStats.mostRecentRating,
    }
}
