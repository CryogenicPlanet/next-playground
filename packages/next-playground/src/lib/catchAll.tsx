/* eslint-disable react/forbid-foreign-prop-types */
/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable no-redeclare */
import { folder, useControls } from 'leva'
import {
  InputWithSettings,
  NumberSettings,
  Schema
} from 'leva/dist/declarations/src/types'
import type { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { tw } from 'twind'
import { css } from 'twind/css'

import { filePathWithoutExt, FuncRecord, PropType } from './types'

const _stackedLayer = css`
  grid-row: 1;
  grid-column: 1;z
`

const getDynamicComponent = (p: string, funcName?: string) =>
  dynamic(
    () =>
      funcName
        ? NextPlayground.importFunc(p).then((mod) => mod[funcName])
        : NextPlayground.importFunc(p),
    {
      ssr: false,
      loading: () => <p>Loading...</p>
    }
  )

const useProps = (filepath: string) => {
  const [data, setData] = useState<FuncRecord | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/next-playground/props?filePath=${filepath}`
        )
        const json = await res.json()
        setData(json)
      } catch (error) {
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [filepath])

  return { data, error, isLoading }
}

const widenPropType = (prop: PropType): Schema => {
  const schema: Schema = {}
  for (const key of Object.keys(prop)) {
    const value = prop[key]!

    if (typeof value === 'string') {
      schema[key] = {
        label: key,
        value:
          value === 'string'
            ? ''
            : value === 'number'
            ? 0
            : value === 'boolean'
            ? false
            : ''
      } as
        | InputWithSettings<number, NumberSettings>
        | InputWithSettings<string>
        | InputWithSettings<boolean>
    } else {
      schema[key] = folder(widenPropType(value))
    }
  }

  return schema
}

const generatePropInputs = (props: PropType[]): Schema => {
  const inputs: Schema = {}

  const idx = 1
  for (const prop of props) {
    inputs[`prop${idx}`] = folder(widenPropType(prop))
  }

  return inputs
}

export const RenderElement = ({
  funcName,
  propTypes,
  defaultExport = false,
  filepath
}: {
  defaultExport?: boolean
  funcName?: string
  filepath: string
  propTypes: PropType[]
}) => {
  const Element = getDynamicComponent(
    filepath,
    defaultExport ? undefined : funcName
  )

  const props = useControls(
    `${funcName} Element`,
    {
      Info: folder({
        [`Info_isDefaultExport`]: {
          label: 'isDefaultExport',
          value: `${defaultExport ? 'Yes' : 'No'}`,
          disabled: true
        },
        [`Info_name`]: {
          label: 'name',
          value: funcName || 'default',
          disabled: true
        }
      }),
      props: folder(generatePropInputs(propTypes))
    },
    [defaultExport, funcName, propTypes]
  )

  // @ts-expect-error The element can have props
  return <Element {...props}></Element>
}

const Playground = ({ filepath }: { filepath: string }) => {
  const { data, error, isLoading } = useProps(filepath)

  const { component } = useControls(
    'Global',
    {
      component: {
        value: null,
        label: 'Component',
        options: Object.keys(data || {})
      }
    },
    [data]
  )

  const value = component ? data?.[component] : null

  const props = value?.props
  const defaultExport = value?.defaultExport

  return (
    <div
      className={tw(`h-full min-h-screen w-full`)}
      style={{
        backgroundColor: '#0F172A',
        backgroundImage: `radial-gradient(rgba(248, 250, 252, 0.7) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '-19px -19px'
      }}>
      {isLoading ? (
        <p className={tw('py-20 text-center text-2xl text-gray-100')}>
          Loading...
        </p>
      ) : error ? (
        <p>Error: {JSON.stringify(error)}</p>
      ) : component && value && props && defaultExport !== undefined ? (
        <>
          {defaultExport ? (
            <RenderElement
              filepath={filepath}
              defaultExport={true}
              propTypes={props}
              funcName={component}
            />
          ) : (
            <RenderElement
              filepath={filepath}
              funcName={component}
              propTypes={props}
            />
          )}
        </>
      ) : (
        <p>Unknown state</p>
      )}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const path = context.params?.path

  const filepath = `${typeof path === 'string' ? path : path?.join('/')}`

  if (process.env.NODE_ENV === 'production') {
    return {
      notFound: true
    }
  }

  fetch(`http://localhost:3000/api/next-playground/props`, {
    method: 'POST',
    body: JSON.stringify({ filePath: filepath }),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // createProps({ filePath: path });

  return {
    props: {
      filepath: filePathWithoutExt.parse(filepath)
    }
  }
}

type NextPlayground = typeof Playground & {
  // eslint-disable-next-line no-unused-vars
  importFunc: (path: string) => Promise<any>
}

const NextPlayground = Playground as NextPlayground

export { NextPlayground }
