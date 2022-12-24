import {
  getServerSidePropsNextPlayground,
  NextPlayground
} from 'next-playground'

NextPlayground.importFunc = (p: string) =>
  import(
    /* webpackInclude: /\.tsx$/ */
    `src/${p}`
  )

export default NextPlayground

export const getServerSideProps = getServerSidePropsNextPlayground
