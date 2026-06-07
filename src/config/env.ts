import path from 'node:path'
import dotenv from 'dotenv'
import { envSchema } from '../schemas/env.schema'

dotenv.config({ path: path.resolve(process.cwd(), 'src/config/.env') })

export const env = envSchema.parse(process.env)
