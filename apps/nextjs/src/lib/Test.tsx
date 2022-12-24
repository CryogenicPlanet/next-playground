export type TestProps = { color: string }

function Dummy() {
  return <div className="h-full w-full bg-red-500 p-20"></div>
}

export default function Test(props: TestProps) {
  return <Dummy></Dummy>
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
  return <div className="h-full w-full bg-yellow-500 p-20"></div>
}
