import { fetchApi } from 'rozod'
import { getUsersAvatar } from 'rozod/endpoints/thumbnailsv1'
import { getUsersSearch, getUsersUserid } from 'rozod/endpoints/usersv1'

const requestOptions = { throwOnError: true } as const

export const searchUsersFromRoblox = (
    keyword: string,
    limit: 10 | 25 | 50 | 100 = 10,
) => fetchApi(getUsersSearch, { keyword, limit }, requestOptions)

export const getUserAvatarsFromRoblox = (userIds: number[]) =>
    fetchApi(getUsersAvatar, {
        userIds,
        size: '180x180',
        format: 'Webp',
        isCircular: false,
    }, requestOptions)

export const getUserInfoFromRoblox = (userId: number) =>
    fetchApi(getUsersUserid, { userId }, requestOptions)
