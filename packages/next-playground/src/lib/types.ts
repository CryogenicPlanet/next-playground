import { z } from 'zod'

export type PropType = { [name: string]: string | PropType }

export const propTypeSchema: z.ZodSchema<PropType> = z.lazy(() =>
  z.record(z.union([z.string(), propTypeSchema]))
)

export const propFuncSchema = z.record(
  z.object({
    props: z.array(propTypeSchema)
  })
)

export type FuncRecord = z.infer<typeof propFuncSchema>

export const propFileSchema = z.record(propFuncSchema)
