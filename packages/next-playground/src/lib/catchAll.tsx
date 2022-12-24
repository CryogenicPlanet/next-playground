/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable no-redeclare */
import type { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { FuncRecord, propFuncSchema } from './types'

const getDynamicComponent = (p: string) =>
  dynamic(() => NextPlayground.importFunc(p), {
    ssr: false,
    loading: () => <p>Loading...</p>
  })

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
        const json = propFuncSchema.parse(await res.json())
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

const Playground = ({ filepath }: { filepath: string }) => {
  const DynamicElement = getDynamicComponent(filepath)

  const { data, error, isLoading } = useProps(filepath)
  console.log({ data, error, isLoading })

  return (
    <div
      className="flex h-full min-h-screen w-full flex-col items-center justify-center bg-slate-900"
      style={{
        // Convert tailwind to style
        display: 'flex',
        height: '100%',
        minHeight: '100vh',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a202c'
      }}>
      <DynamicElement></DynamicElement>
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
      filepath: filepath.replace(/\.tsx$/, '')
    }
  }
}

type NextPlayground = typeof Playground & {
  // eslint-disable-next-line no-unused-vars
  importFunc: (path: string) => Promise<any>
}

const NextPlayground = Playground as NextPlayground

export { NextPlayground }
