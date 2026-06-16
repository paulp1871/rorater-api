import type { RequestHandler } from 'express'
import type { z } from 'zod'

export interface ValidatedQueryLocals<T> {
    validatedQuery: T
}

export interface ValidatedParamsLocals<T> {
    validatedParams: T
}

export interface ValidatedBodyLocals<T> {
    validatedBody: T
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

export const validateParams = <Schema extends z.ZodType>(
    schema: Schema,
): RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedParamsLocals<z.output<Schema>>
> => (req, res, next) => {
    const result = schema.safeParse(req.params)

    if (!result.success) {
        res.status(400).json({
            message: result.error.issues[0]?.message ?? 'Invalid route parameters',
        })
        return
    }

    res.locals.validatedParams = result.data
    next()
}

export const validateBody = <Schema extends z.ZodType>(
    schema: Schema,
): RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedBodyLocals<z.output<Schema>>
> => (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
        res.status(400).json({
            message: result.error.issues[0]?.message ?? 'Invalid request body',
        })
        return
    }

    res.locals.validatedBody = result.data
    next()
}
