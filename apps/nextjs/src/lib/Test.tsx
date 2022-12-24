export type TestProps = { color: string }

function Dummy() {
  return <div className="h-full w-full bg-red-500 p-20"></div>
}

export default function Test(props: TestProps) {
  return (
    <div className="flex h-full w-full items-center justify-center p-40">
      <Dummy></Dummy>
    </div>
  )
}

export const Test2 = ({
  id,
  value,
  test
}: {
  id: string
  value: number
  test: TestProps
}) => {
  console.log({ id, value, test })

  return <div className="h-full w-full bg-yellow-500 p-20"></div>
}
