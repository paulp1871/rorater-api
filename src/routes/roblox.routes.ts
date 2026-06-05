import { Router } from 'express'
import { userSearchHandler } from '../controllers/roblox.controller'

const robloxRouter: Router = Router()

robloxRouter.get(
    '/users/search',
    userSearchHandler,
)

export { robloxRouter }
