import {
  getServerSideProps,
  NextPlayground
} from 'next-playground/src/lib/catchAll'

NextPlayground.importFunc = (p: string) =>
  import(
    /* webpackInclude: /\.tsx$/ */
    `src/${p}`
  )

export default NextPlayground

export { getServerSideProps }
