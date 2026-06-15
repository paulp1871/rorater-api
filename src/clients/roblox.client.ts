import { fetchApi } from 'rozod'
import { getUsersUseridAvatar } from 'rozod/endpoints/avatarv1'
import { getAssetsThumbnail3d, getUsersAvatar, getUsersAvatar3d } from 'rozod/endpoints/thumbnailsv1'
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

export const getUserAvatarDetailsFromRoblox = (userId: number) =>
    fetchApi(getUsersUseridAvatar, { userId }, requestOptions)

export const getUserAvatar3dFromRoblox = (userId: number) =>
    fetchApi(getUsersAvatar3d, { userId }, requestOptions)

export const getAsset3dFromRoblox = (assetId: number) =>
    fetchApi(getAssetsThumbnail3d, { assetId }, requestOptions)
