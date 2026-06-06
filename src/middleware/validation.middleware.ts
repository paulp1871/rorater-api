import type { RequestHandler } from 'express'
import type { z } from 'zod'

export interface ValidatedQueryLocals<T> {
    validatedQuery: T
}

export const validateQuery = <Schema extends z.ZodType>(
    schema: Schema,
): RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedQueryLocals<z.output<Schema>>
> => (req, res, next) => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
        res.status(400).json({
            message: result.error.issues[0]?.message ?? 'Invalid query parameters',
        })
        return
    }

    res.locals.validatedQuery = result.data
    next()
}
