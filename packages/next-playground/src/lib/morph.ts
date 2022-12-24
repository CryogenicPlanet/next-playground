/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-types */
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import type { FunctionDeclaration, ts } from 'ts-morph'
import { ArrowFunction, Node, Project, SyntaxKind } from 'ts-morph'

import { FuncRecord, propFileSchema, PropType } from './types'

const kindToTypeString = (kind: SyntaxKind) => {
  switch (kind) {
    case SyntaxKind.StringKeyword:
      return 'string'
    case SyntaxKind.NumberKeyword:
      return 'number'
    case SyntaxKind.BooleanKeyword:
      return 'boolean'
    case SyntaxKind.TypeLiteral:
      return 'typeLiteral'
    case SyntaxKind.TypeReference:
      return 'typeReference'
    case SyntaxKind.AnyKeyword:
      return 'any'
    case SyntaxKind.UnknownKeyword:
      return 'unknown'
    case SyntaxKind.VoidKeyword:
      return 'void'
    case SyntaxKind.UndefinedKeyword:
      return 'undefined'
    case SyntaxKind.NullKeyword:
      return 'null'
    case SyntaxKind.Parameter:
      return 'parameter'
    case SyntaxKind.TypeAliasDeclaration:
      return 'typeAliasDeclaration'
    default:
      console.log({ kind })
      return '¯_(ツ)_/¯'
  }
}

export const generatePropsForFile = async (filePath: string) => {
  const project = new Project()
  project.addSourceFilesAtPaths('src/**/*.tsx')
  const sourceFile = project.getSourceFileOrThrow(`src/${filePath}`)

  const functions = sourceFile.getFunctions()
  const variables = sourceFile.getVariableDeclarations()

  const exportedFuncs: Array<FunctionDeclaration | ArrowFunction> = []

  const exportedFuncRecord: FuncRecord = {}

  for (const func of functions) {
    // check if exported
    if (func.isExported()) {
      exportedFuncs.push(func)
    }
  }

  const typeAlias = sourceFile.getTypeAliases()

  const typeAliasMap: Record<string, PropType> = {}

  const getTypeFromTypeLiteral = (typeStr: string): PropType => {
    const typeJson = Object.fromEntries(
      typeStr
        .replace('{', '')
        .replace('}', '')
        .replace(/\n/g, '')
        .split(';')
        .map((i) => i.split(':').map((v) => v.trim()))
        .filter((v) => v[0] !== '')
    )

    const types: PropType = {}

    for (const [key, value] of Object.entries(typeJson)) {
      if (typeof value === 'string' && typeAliasMap[value]) {
        types[key] = typeAliasMap[value]!
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //   @ts-ignore
        types[key] = value
      }
    }

    return types
  }

  const typeAliasEncounteredMap = new Set<string>()

  function getPropTypeFromDeclarations(declarations: Node<ts.Node>[]) {
    const declaration = declarations?.[0]
    if (
      !Node.isParameterDeclaration(declaration) &&
      !Node.isTypeAliasDeclaration(declaration) &&
      !Node.isTypeLiteral(declaration)
    )
      throw Error('Not valid declaration')

    const alias = declaration?.getType().getAliasSymbol()?.getName()

    let type = declaration.getType()
    let kind: ReturnType<typeof kindToTypeString> = kindToTypeString(
      declaration.compilerNode.kind
    )

    if (kind === 'parameter' || kind === 'typeAliasDeclaration') {
      // @ts-expect-error - type defined in the ADT
      type = declaration?.compilerNode.type
      //   @ts-expect-error - type defined in the ADT
      kind = kindToTypeString(type.kind)
    }

    console.log({ alias, kind, typeStr: type.getText() })

    if (!type) return null

    if (kind === 'typeLiteral') {
      const types = getTypeFromTypeLiteral(type.getText())

      return types
    } else if (kind === 'typeReference' && alias) {
      const types = typeAliasMap[alias]
      if (!types) {
        typeAliasEncounteredMap.add(alias)
      }
      return types
    }
  }

  for (const alias of typeAlias) {
    const name = alias.getName()

    const declarations = alias.getSymbol()?.getDeclarations()
    if (!declarations) continue
    const propType = getPropTypeFromDeclarations(declarations)
    if (!propType) continue
    typeAliasMap[name] = propType
  }

  const importedTypes = sourceFile.getImportDeclarations()

  for (const importedType of importedTypes) {
    const namedImports = importedType.getNamedImports()
    for (const namedImport of namedImports) {
      const name = namedImport.getSymbol()?.getAliasedSymbol()?.getName()
      if (name) {
        const declarations = namedImport
          .getSymbol()
          ?.getAliasedSymbol()
          ?.getDeclarations()
        if (!declarations) continue
        const propType = getPropTypeFromDeclarations(declarations)
        if (!propType) continue
        typeAliasMap[name] = propType
      }
    }
  }

  for (const variable of variables) {
    if (variable.isExported()) {
      // Check if arrow function

      const initializer = variable.getInitializer()
      if (initializer?.getKind() === 216 && Node.isArrowFunction(initializer)) {
        exportedFuncs.push(initializer)
      }
    }
  }

  let idx = 0

  for (const func of exportedFuncs) {
    // Get props of func
    const parameters = func.getParameters()

    const name = Node.isFunctionDeclaration(func)
      ? func.getName()
      : // @ts-expect-error This is a hack
        func.getParent()?.getName() || `${ArrowFunction}-${idx++}`

    exportedFuncRecord[name] = {
      props: []
    }

    for (const parameter of parameters || []) {
      const symbol = parameter.getSymbol() || parameter.getType().getSymbol()

      const declarations = symbol?.getDeclarations()

      if (!declarations) continue

      const propType = getPropTypeFromDeclarations(declarations)
      if (!propType) continue
      exportedFuncRecord[name]!.props.push(propType)
    }
  }

  const FILE_PATH = '.next/novella-props.json'

  if (existsSync(FILE_PATH)) {
    // Read file
    const data = propFileSchema.parse(
      JSON.parse(await readFile(FILE_PATH, 'utf-8'))
    )

    data[filePath] = exportedFuncRecord

    await writeFile(FILE_PATH, JSON.stringify(data, null, 2), {
      encoding: 'utf-8'
    })
  } else {
    const data = JSON.stringify({ [filePath]: exportedFuncRecord }, null, 2)

    await writeFile(FILE_PATH, data, {
      encoding: 'utf-8'
    })
  }
}
