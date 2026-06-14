import {
    getUserAvatarsFromRoblox,
    searchUsersFromRoblox,
} from '../clients/roblox.client'
import type { UserSearchQuery } from '../schemas/roblox.schema'

const USER_SEARCH_LIMIT = 25

type AvatarData = Awaited<ReturnType<typeof getUserAvatarsFromRoblox>>['data'][number]

const formatAvatar = (avatar: AvatarData | undefined) => {
    if (!avatar) return null
    return {
        url: avatar.state === 'Completed' ? avatar.imageUrl : null,
        state: avatar.state,
    }
}

export const searchRobloxUsersWithAvatars = async (
    { keyword }: UserSearchQuery,
) => {
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
}
