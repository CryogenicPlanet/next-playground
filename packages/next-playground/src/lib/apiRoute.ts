import type { NextApiRequest, NextApiResponse } from 'next'

import { generatePropsForFile } from './morph'
import { propFileSchema } from './types'

let creatingFile = false

export const NextPlaygroundApi = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const filePath = (req.query.filePath || req.body.filePath) as string

  if (req.method === 'GET') {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!creatingFile) {
          clearInterval(interval)
          resolve(true)
        }
      }, 100)
    })

    const promises = await import('node:fs/promises')

    const file = await promises.readFile('.next/novella-props.json', {
      encoding: 'utf-8'
    })

    const data = propFileSchema.parse(JSON.parse(file))

    const props = data[filePath]
    if (!props) {
      res.status(404).json({ message: 'Props not found' })
    } else {
      res.status(200).json(props)
    }
  } else if (req.method === 'POST') {
    creatingFile = true
    console.log('generating props for file', filePath)
    await generatePropsForFile(filePath)
    creatingFile = false
    console.log('done generating props for file', filePath)
    res.status(200).json({ message: 'ok' })
  }
}
