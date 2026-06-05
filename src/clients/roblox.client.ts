import { fetchApi } from 'rozod';
import { getUsersSearch } from 'rozod/endpoints/usersv1';

export const getUserByKeywordFromRoblox = async (keyword: string) => {
    const data = await fetchApi(getUsersSearch, {
        keyword: keyword
    })

    return data
}