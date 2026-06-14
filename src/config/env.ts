import path from 'node:path'
import dotenv from 'dotenv'
import { envSchema } from '../schemas/env.schema'

// Values supplied by the shell, such as `NODE_ENV=production npm start`,
// take precedence over local development values loaded from this file.
dotenv.config({
    path: path.resolve(process.cwd(), 'src/config/.env'),
    override: false,
})

export const env = envSchema.parse(process.env)
