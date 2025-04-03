import * as process from 'process'
import { FungibleToken, NonFungibleCollection, NonFungibleToken } from './type'
import { CoinGecko } from './providers/coingecko'
import { initFolder, mergePublicFileToOutput, writeCollectionsToFile, writeTokensToFile, writeDAOToFile } from './utils'
import { CoinMarketCap } from './providers/coinmarketcap'
import { NFTScanCollection, NFTScanToken } from './providers/NFTScan'
import { DAO } from './providers/dao'
import { CoinGeckoCollection } from './providers/coingecko-collection'

const coinGeckoAPI = new CoinGecko()
const coinGeckoCollectionAPI = new CoinGeckoCollection()
const nftScanTokenAPI = new NFTScanToken()
const nftScanCollectionAPI = new NFTScanCollection()
const cmcAPI = new CoinMarketCap()
const daoAPI = new DAO()

const fungibleProviders = [coinGeckoAPI]
const nonFungibleTokenProviders = [nftScanTokenAPI]
const nonFungibleCollectionProviders = [nftScanCollectionAPI, coinGeckoCollectionAPI]

async function getFungibleTokens() {
  await Promise.allSettled(
    fungibleProviders.map(async (p) => {
      const providerName = p.getProviderName()
      let fungibleTokens: FungibleToken[] = []
      console.log(`${providerName}: fetch the data from ${providerName}`)
      try {
        const tokens = await p.getTopTokens()
        fungibleTokens = [...fungibleTokens, ...tokens]
      } catch (e) {
        console.log(`${providerName}: fetching the chain failed`)
        console.log(e)
      }

      console.log(`${providerName}: The current chain get ${fungibleTokens.length} tokens`)

      if (fungibleTokens.length) {
        await writeTokensToFile(
          p.getProviderName(),
          'fungible-tokens',
          fungibleTokens.filter((x) => x.source === p.getProviderName()),
        )
      }
    }),
  )
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
  await Promise.allSettled(
    nonFungibleCollectionProviders.map(async (p) => {
      let nonFungibleCollections: NonFungibleCollection[] = []
      const providerName = p.getProviderName()
      console.log(`${providerName}: fetching data...`)
      try {
        const collections = await p.getCollections()
        nonFungibleCollections = [...nonFungibleCollections, ...collections]
      } catch (e) {
        console.log(`${providerName}: failed to fetch data`)
        console.log(e)
      }

      console.log(`CoinGecko: get total ${nonFungibleCollections.length} collections`)

      if (nonFungibleCollections.length) {
        await writeCollectionsToFile(p.getProviderName(), nonFungibleCollections)
      }
    }),
  )
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
