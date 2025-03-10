import * as process from 'process'
import { FungibleToken, NonFungibleCollection, NonFungibleToken } from './type'
import { CoinGecko } from './providers/coingecko'
import { initFolder, mergePublicFileToOutput, writeCollectionsToFile, writeTokensToFile, writeDAOToFile } from './utils'
import { CoinMarketCap } from './providers/coinmarketcap'
import { NFTScanCollection, NFTScanToken } from './providers/NFTScan'
import { DAO } from './providers/dao'

const coinGeckoAPI = new CoinGecko()
const nftScanTokenAPI = new NFTScanToken()
const nftScanCollectionAPI = new NFTScanCollection()
const cmcAPI = new CoinMarketCap()
const daoAPI = new DAO()

const fungibleProviders = [coinGeckoAPI, cmcAPI]
const nonFungibleTokenProviders = [nftScanTokenAPI]
const nonFungibleCollectionProviders = [nftScanCollectionAPI]

async function getFungibleTokens() {
  for (const p of fungibleProviders) {
    let fungibleTokens: FungibleToken[] = []
    console.log(`Fetch the data from ${p.getProviderName()}`)
    try {
      const tokens = await p.getTopTokens()
      fungibleTokens = [...fungibleTokens, ...tokens]
    } catch (e) {
      console.log(`Fetching the chain failed by ${p.getProviderName()}`)
      console.log(e)
    }

    console.log(`The current chain get ${fungibleTokens.length} tokens`)

    if (fungibleTokens.length) {
      await writeTokensToFile(
        p.getProviderName(),
        'fungible-tokens',
        fungibleTokens.filter((x) => x.source === p.getProviderName()),
      )
    }
  }
}

async function getNonFungibleTokens() {
  for (const p of nonFungibleTokenProviders) {
    let nonFungibleTokens: NonFungibleToken[] = []
    console.log(`Fetch the data from ${p.getProviderName()}`)
    try {
      const tokens = await p.getTopTokens()
      nonFungibleTokens = [...nonFungibleTokens, ...tokens]
    } catch (e) {
      console.log(`Fetch the chain failed by ${p.getProviderName()}`)
      console.log(e)
    }

    console.log(`The current chain get ${nonFungibleTokens.length} tokens`)

    if (nonFungibleTokens.length) {
      await writeTokensToFile(p.getProviderName(), 'non-fungible-tokens', nonFungibleTokens)
    }
  }
}

async function getNonfungibleCollections() {
  for (const p of nonFungibleCollectionProviders) {
    let nonFungibleCollections: NonFungibleCollection[] = []
    console.log(`Fetch the data from ${p.getProviderName()}`)
    try {
      const collections = await p.getCollections()
      nonFungibleCollections = [...nonFungibleCollections, ...collections]
    } catch (e) {
      console.log(`Fetch the chain failed by ${p.getProviderName()}`)
      console.log(e)
    }

    console.log(`The current chain get ${nonFungibleCollections.length} collections`)

    if (nonFungibleCollections.length) {
      await writeCollectionsToFile(p.getProviderName(), nonFungibleCollections)
    }
  }
}

async function getDaos() {
  const spaces = await daoAPI.getSpaces()
  await writeDAOToFile(spaces)
}

async function main() {
  await initFolder()

  await Promise.allSettled([getFungibleTokens(), getNonFungibleTokens(), getNonfungibleCollections(), getDaos()])

  await Promise.all([
    mergePublicFileToOutput('non-fungible-collections'),
    mergePublicFileToOutput('non-fungible-tokens'),
    mergePublicFileToOutput('nft-lucky-drop'),
    mergePublicFileToOutput('fungible-tokens'),
    mergePublicFileToOutput('dao'),
  ])

  console.log('Generate success!')
  process.exit(0)
}

main()
