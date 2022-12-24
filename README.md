# Next Playground (wip)

This is like a storybook where you can play with components and change their props but fully automatic.

This is very much a wip and I am not sure if it will be stable anytime soon - it is quite janky.

This is not meant to be a replacement for storybook, especially as storybook has a way to be deployed - this is much more for local development.

Currently only support `next` and `typescript`, this will not work if you don't use `next` and `typescript`. No immediate plans to support other frameworks, and no plans to support javascript.

## Setup

There are quite a **few fairly important steps** to get this working.

1. Install the package

```bash
npm install --save-dev next-playground
```

2. Setup catchall route `pages/next-playground/[...path].tsx` **The name of the file is important**.

2a. In this file you have to `export { getServerSideProps }` from `next-playground`

2b. You have to set `NextPlayground.importFunc` to a function that will import your components. This is because `webpack` does not allow dynamic imports anymore. This function will be called with the path to the component, and you have to return the import.

You can customise the default path and which files are allowed to be imported. You can use `webpackInclude` as a magicComment to only include `.tsx` files (if you don't webpack will try to load every `.ts` file in src)

```tsx
// pages/next-playground/[...path].tsx
import {
  getServerSideProps,
  NextPlayground
} from 'next-playground'

NextPlayground.importFunc = (p: string) =>
  import(
    /* webpackInclude: /\.tsx$/ */
    `src/${p}`
  )

export default NextPlayground

export { getServerSideProps }
```

Make sure 2a and 2b are done correctly, these are very important and `next-playground` will not work if you don't do this.

3. Add a api route `pages/api/next-playground/[next-playground].ts`

```ts
import { NextPlaygroundApi } from 'next-playground'

export default NextPlaygroundApi
```

## Usage

Once you have setup the above, you can run `next dev` adn go to `http://localhost:3000/next-playground/${PATH}` to see your component.

For example if you wanted to play with `src/lib/components/Button.tsx` you would go to `http://localhost:3000/next-playground/lib/components/Button.tsx`

## Caveats

The typescript AST parsing I've written is very jank and needs a lot of work, this was just a hack and I am sure you will run into errors parsing certain more complex typescript files.
