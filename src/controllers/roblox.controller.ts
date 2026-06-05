import type { RequestHandler, Request, Response } from 'express'
import { getUserByKeywordFromRoblox } from '../clients/roblox.client'

interface KeywordQuery {
    keyword?: string
}

export const userSearchHandler: RequestHandler = async (req: Request<{}, {}, {}, KeywordQuery>, res: Response) => {
    const { keyword } = req.query

    if (!keyword) {
        return res.status(401).json({ message: "Invalid keyword" })
    }

    const data = await getUserByKeywordFromRoblox(keyword)

    res.json(data)
}
