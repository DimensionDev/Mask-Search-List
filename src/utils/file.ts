import path from 'node:path'
import fs from 'node:fs/promises'
import { FungibleToken, NonFungibleCollection, NonFungibleToken, SourceType, Space } from '../type'

// @ts-ignore
export const getOutputDir = (type) => path.join(process.env.PWD, `output/${type}`)
// @ts-ignore
export const getPublicDir = (type) => path.join(process.env.PWD, `public/${type}`)

export async function initFolder() {
  await createIfNotExist(getOutputDir('fungible-tokens'))
  await createIfNotExist(getOutputDir('non-fungible-tokens'))
  await createIfNotExist(getOutputDir('non-fungible-collections'))
  await createIfNotExist(getOutputDir('nft-lucky-drop'))
  await createIfNotExist(getOutputDir('dao'))
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

export async function writeDAOToFile(spaces: Space[]) {
  if (!spaces.length) throw new Error(`Forbid writing the empty data of DAO to output`)

  await fs.writeFile(
    path.join(getOutputDir('dao'), `spaces.json`),
    JSON.stringify(spaces, undefined, 2),
    {
      encoding: 'utf-8',
    },
  )
}

export async function mergePublicFileToOutput(
  type: 'fungible-tokens' | 'non-fungible-tokens' | 'non-fungible-collections' | 'nft-lucky-drop' | 'dao',
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
