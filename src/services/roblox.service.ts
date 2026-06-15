import {
    getAsset3dFromRoblox,
    getUserAvatar3dFromRoblox,
    getUserAvatarDetailsFromRoblox,
    getUserAvatarsFromRoblox,
    getUserInfoFromRoblox,
    searchUsersFromRoblox,
} from '../clients/roblox.client'
import { getUserRatingStats } from '../db/user.db'
import type { UserSearchQuery } from '../schemas/roblox.schema'
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
        thumbnail3d: Thumbnail
    }[]
    averageRating: number | null
    mostRecentRating: { score: number; raterId: string; createdAt: Date } | null
}

const formatAvatar = (avatar: AvatarData | undefined): Thumbnail => {
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

export const getRobloxUserProfile = (userId: number): Promise<UserProfile> =>
    withCache(profileCacheKey(userId), PROFILE_TTL, async () => {
        const avatarDetailsPromise = getUserAvatarDetailsFromRoblox(userId)
        const assetThumbnails3dPromise = avatarDetailsPromise.then((details) =>
            Promise.all(details.assets.map((asset) => getAsset3dFromRoblox(asset.id))),
        )

        const [userInfo, avatarThumbnail, avatar3d, avatarDetails, ratingStats, assetThumbnails3d] =
            await Promise.all([
                getUserInfoFromRoblox(userId),
                getUserAvatarsFromRoblox([userId]),
                getUserAvatar3dFromRoblox(userId),
                avatarDetailsPromise,
                getUserRatingStats(BigInt(userId)),
                assetThumbnails3dPromise,
            ])

        const assetThumbnail3dById = new Map(
            assetThumbnails3d.map((thumbnail) => [thumbnail.targetId, thumbnail]),
        )

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
                thumbnail3d: formatAvatar(assetThumbnail3dById.get(asset.id)),
            })),
            averageRating: ratingStats.averageRating,
            mostRecentRating: ratingStats.mostRecentRating,
        }
    })
