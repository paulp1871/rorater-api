import type { ErrorRequestHandler, RequestHandler } from 'express'

// Lightweight, Morgan-`dev`-style logging used only in development (see app.ts,
// where these are registered behind a NODE_ENV check). Kept dependency-free so
// production builds carry no logging overhead.

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

// Logs one line per request once the response is sent, including status and the
// wall-clock time spent handling it: `GET /api/roblox/users/search 200 12.3 ms`.
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

// Logs the full error (with stack) alongside the request that triggered it, then
// hands off to the next error handler — it observes, it does not respond.
export const errorLogger: ErrorRequestHandler = (err, req, res, next) => {
    console.error(`\x1b[31mERROR\x1b[0m ${req.method} ${req.originalUrl}`)
    console.error(err instanceof Error ? err.stack ?? err.message : err)
    next(err)
}
