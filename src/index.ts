import { FungibleToken, NonFungibleCollection, NonFungibleToken } from './type'
import { CoinGecko } from './providers/coingecko'
import { writeCollectionsToFile, writeTokensToFile } from './utils'
import * as process from 'process'
import { CoinMarketCap } from './providers/coinmarketcap'
import { NFTScanCollection, NFTScanToken } from './providers/NFTScan'

const coinGeckoAPI = new CoinGecko()
const nftScanTokenAPI = new NFTScanToken()
const nftScanCollectionAPI = new NFTScanCollection()
const cmcAPI = new CoinMarketCap()

const fungibleProviders = [coinGeckoAPI, cmcAPI]
const nonFungibleTokenProviders = [nftScanTokenAPI]
const nonFungibleCollecitonProviders = [nftScanCollectionAPI]

async function main() {
  let fungibleTokens: FungibleToken[] = []
  for (const p of fungibleProviders) {
    console.log(`Fetch the data from ${p.getProviderName()}`)
    try {
      const tokens = await p.getTopTokens()
      fungibleTokens = [...fungibleTokens, ...tokens]
    } catch (e) {
      console.log(`Fetching the chain failed by ${p.getProviderName()}`)
      console.log(e)
    }

    console.log(`The current chain get ${fungibleTokens.length} tokens`)

    await writeTokensToFile(p.getProviderName(), 'fungible-tokens', fungibleTokens)
  }

  let nonFungibleTokens: NonFungibleToken[] = []
  for (const p of nonFungibleTokenProviders) {
    try {
      const tokens = await p.getTopTokens()
      nonFungibleTokens = [...nonFungibleTokens, ...tokens]
    } catch (e) {
      console.log(`Fetch the chain failed by ${p.getProviderName()}`)
      console.log(e)
    }

    console.log(`The current chain get ${nonFungibleTokens.length} tokens`)

    await writeTokensToFile(p.getProviderName(), 'non-fungible-tokens', nonFungibleTokens)
  }

  let nonFungibleCollections: NonFungibleCollection[] = []
  for (const p of nonFungibleCollecitonProviders) {
    try {
      const collections = await p.getCollections()
      nonFungibleCollections = [...nonFungibleCollections, ...collections]
    } catch (e) {
      console.log(`Fetch the chain failed by ${p.getProviderName()}`)
      console.log(e)
    }

    console.log(`The current chain get ${nonFungibleCollections.length} collections`)

    await writeCollectionsToFile(p.getProviderName(), nonFungibleCollections)
  }

  console.log('Generate success!')
  process.exit(0)
}

main()
