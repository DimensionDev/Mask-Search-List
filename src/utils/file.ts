import path from 'node:path'
import fs from 'node:fs/promises'
import { FungibleToken, NonFungibleCollection, NonFungibleToken, SourceType } from '../type'

// @ts-ignore
export const getOutputDir = (type) => path.join(process.env.PWD, `output/${type}`)

export async function writeTokensToFile(
  provider: SourceType,
  type: 'fungible-tokens' | 'non-fungible-tokens',
  tokens: FungibleToken[] | NonFungibleToken[],
) {
  await fs.writeFile(
    path.join(getOutputDir(type), `${provider?.toLowerCase()}.json`),
    JSON.stringify(tokens, undefined, 2),
    {
      encoding: 'utf-8',
    },
  )
}

export async function writeCollectionsToFile(provider: SourceType, tokens: FungibleToken[] | NonFungibleCollection[]) {
  await fs.writeFile(
    path.join(getOutputDir('non-fungible-collections'), `${provider?.toLowerCase()}.json`),
    JSON.stringify(tokens, undefined, 2),
    {
      encoding: 'utf-8',
    },
  )
}
