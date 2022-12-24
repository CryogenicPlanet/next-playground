import { z } from 'zod'

import { TypeStrings } from './morph'

export type PropType = { [name: string]: TypeStrings | PropType }

const typeStringsSchema: z.ZodSchema<TypeStrings> = z.union([
  z.literal('string'),
  z.literal('number'),
  z.literal('boolean'),
  z.literal('typeLiteral'),
  z.literal('typeReference'),
  z.literal('any'),
  z.literal('unknown'),
  z.literal('void'),
  z.literal('undefined'),
  z.literal('null'),
  z.literal('parameter'),
  z.literal('typeAliasDeclaration'),
  z.literal('\u00AF_(\u30C4)_/\u00AF')
])

export const propTypeSchema: z.ZodSchema<PropType> = z.lazy(() =>
  z.record(z.union([typeStringsSchema, propTypeSchema]))
)

export const propFuncSchema = z.record(
  z.object({
    props: z.array(propTypeSchema),
    defaultExport: z.boolean().default(false)
  })
)

export type FuncRecord = z.infer<typeof propFuncSchema>

export const propFileSchema = z.record(propFuncSchema)

export const filePathWithoutExt = z
  .string()
  .refine((v) => v.replace(/\.tsx$/, ''))
