import type { ErrorRequestHandler, RequestHandler } from 'express'

const RESET = '\x1b[0m'

// Colour the status code by class the way Morgan's `dev` format does, so a red
// 5xx jumps out while scanning the dev console.
const colourStatus = (status: number): string => {
    const colour =
        status >= 500 ? '\x1b[31m' // red
        : status >= 400 ? '\x1b[33m' // yellow
        : status >= 300 ? '\x1b[36m' // cyan
        : '\x1b[32m' // green
    return `${colour}${status}${RESET}`
}

export const requestLogger: RequestHandler = (req, res, next) => {
    const start = process.hrtime.bigint()

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6
        const length = res.getHeader('content-length')
        const size = length === undefined ? '' : ` - ${length}`
        console.log(
            `${req.method} ${req.originalUrl} ${colourStatus(res.statusCode)} ${durationMs.toFixed(1)} ms${size}`,
        )
    })

    next()
}

export const errorLogger: ErrorRequestHandler = (err, req, res, next) => {
    console.error(`\x1b[31mERROR\x1b[0m ${req.method} ${req.originalUrl}`)
    console.error(err instanceof Error ? err.stack ?? err.message : err)
    next(err)
}
