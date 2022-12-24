import dts from 'dts-bundle'

dts.bundle({
  name: 'next-playground',
  main: 'dist/src/index.d.ts',
  out: '../index.d.ts'
})

dts.bundle({
  name: 'next-playground/api',
  main: 'dist/src/api.d.ts',
  out: '../api.d.ts'
})