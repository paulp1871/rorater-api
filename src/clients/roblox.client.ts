import { fetchApi } from 'rozod'
import { getUsersAvatar } from 'rozod/endpoints/thumbnailsv1'
import { getUsersSearch, getUsersUserid } from 'rozod/endpoints/usersv1'

const requestOptions = { throwOnError: true } as const

export const searchUsersFromRoblox = async (
    keyword: string,
    limit: 10 | 25 | 50 | 100 = 10,
    cursor?: string,
) => {
    const parameters = cursor
        ? { keyword, limit, cursor }
        : { keyword, limit }

    return fetchApi(getUsersSearch, parameters, requestOptions)
}

export const getUserAvatarsFromRoblox = (userIds: number[]) =>
    fetchApi(getUsersAvatar, {
        userIds,
        size: '180x180',
        format: 'Webp',
        isCircular: false,
    }, requestOptions)

export const getUserInfoFromID = (id: number) =>
    fetchApi(getUsersUserid, {
        userId: id,
    }, requestOptions)
