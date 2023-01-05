import path from 'node:path'
import fs from 'node:fs/promises'
import { FungibleToken, NonFungibleCollection, NonFungibleToken, SourceType } from '../type'

// @ts-ignore
export const getOutputDir = (type) => path.join(process.env.PWD, `output/${type}`)
// @ts-ignore
export const getPublicDir = (type) => path.join(process.env.PWD, `public/${type}`)

export async function initFolder() {
  await createIfNotExist(getOutputDir('fungible-tokens'))
  await createIfNotExist(getOutputDir('non-fungible-tokens'))
  await createIfNotExist(getOutputDir('non-fungible-collections'))
}

export async function writeTokensToFile(
  provider: SourceType,
  type: 'fungible-tokens' | 'non-fungible-tokens',
  tokens: FungibleToken[] | NonFungibleToken[],
) {
  if (!tokens.length) throw new Error(`Forbid writing the empty data of ${provider}'s ${tokens} to output`)

  await fs.writeFile(
    path.join(getOutputDir(type), `${provider?.toLowerCase()}.json`),
    JSON.stringify(tokens, undefined, 2),
    {
      encoding: 'utf-8',
    },
  )
}

export async function writeCollectionsToFile(provider: SourceType, tokens: FungibleToken[] | NonFungibleCollection[]) {
  if (!tokens.length) throw new Error(`Forbid writing the empty data of ${provider}'s ${tokens} to output`)

  await fs.writeFile(
    path.join(getOutputDir('non-fungible-collections'), `${provider?.toLowerCase()}.json`),
    JSON.stringify(tokens, undefined, 2),
    {
      encoding: 'utf-8',
    },
  )
}

export async function mergePublicFileToOutput(
  type: 'fungible-tokens' | 'non-fungible-tokens' | 'non-fungible-collections',
) {
  const src = path.join(`${getPublicDir(type)}`, 'specific-list.json')
  const dest = path.join(`${getOutputDir(type)}`, 'specific-list.json')

  await fs.copyFile(src, dest)
}

async function createIfNotExist(path: string) {
  try {
    const handle = await fs.opendir(path)
    await handle.close()
  } catch {
    await fs.mkdir(path, { recursive: true })
  }
}
