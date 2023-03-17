import axios from 'axios'
import { orderBy } from 'lodash'
import urlcat from 'urlcat'
import {
  EVMChainId,
  NetworkPluginID,
  NonFungibleCollection,
  NonFungibleCollectionProvider,
  NonFungibleToken,
  NonFungibleTokenProvider,
  SearchResultType,
  SolanaChainId,
  SourceType,
} from '../type'
import { delay, getRuntimeEnableCache } from '../utils'

const baseURL = 'https://nftscan-proxy.r2d2.to'

const config = {
  chain: 'eth',
  chainId: EVMChainId.Mainnet,
  pluginID: NetworkPluginID.PLUGIN_EVM,
  url: 'https://restapi.nftscan.com',
  coin: 'ETH',
  limit: 500,
}

export type Response = {
  code: number
  msg: any
  data: Array<{
    contract_address: string
    contract_name?: string
    logo_url?: string
    items_total: number
    market_cap: number
    average_market_price: number
  }>
}

export type CollectionResponse = {
  code: number
  msg: any
  data: {
    contract_address: string
    name: string
    symbol: string
    description: string
    website: string
    email: string
    twitter: string
    discord: string
    telegram: string
    github: string
    instagram: string
    medium: string
    logo_url: string
    banner_url: string
    featured_url: string
    large_image_url: string
    attributes: string
    erc_type: string
    deploy_block_number: number
    owner: string
    verified: boolean
    opensea_verified: boolean
    royalty: string
    items_total: number
    amounts_total: string
    owners_total: number
    opensea_floor_price: number
    floor_price: number
    collections_with_same_name: string
    price_symbol: string
    volume_total: number
  }
}

export type CollectionsRankingResponse = {
  code: number
  msg: any
  data: Array<{
    contract_address: string
    contract_name: string
    market_cap: string
  }>
}

export type SolanaCollectionsRankingResponse = {
  code: number
  msg: any
  data: Array<{
    collection: string
    market_cap: string
  }>
}

export class NFTScanToken implements NonFungibleTokenProvider {
  async getTopTokens() {
    let result: NonFungibleToken[] = []

    const url = urlcat(baseURL, '/api/v2/statistics/ranking/marketcap')
    const list = await axios.get<Response>(url, {
      headers: {
        'content-type': 'application/json',
        'x-app-chainid': config.chainId.toString(),
      },
    })

    const data = list.data.data
      .map(
        (x, index) =>
        ({
          pluginID: config.pluginID,
          address: x.contract_address,
          name: x.contract_name,
          chainId: config.chainId,
          type: SearchResultType.NonFungibleToken,
          source: SourceType.NFTScan,
          logoURL: x.logo_url,
          rank: index + 1,
        } as NonFungibleToken),
      )
      .slice(0, config.limit)

    result = [...result, ...data]

    return result
  }

  getProviderName(): SourceType {
    return SourceType.NFTScan
  }
}

let cache: NonFungibleCollection[] | undefined = undefined

export class NFTScanCollection implements NonFungibleCollectionProvider {
  async getSolanaCollection(name: string, rank: number) {
    const collectionURL = urlcat(baseURL, '/api/sol/collections/:collection_name', { collection_name: name })

    const collectionResult = await axios.get<CollectionResponse>(collectionURL, {
      headers: {
        'content-type': 'application/json',
        'x-app-chainid': 'solana',
      },
    })

    await delay(1000)

    const collection = collectionResult.data.data

    return {
      pluginID: NetworkPluginID.PLUGIN_SOLANA,
      address: collection.contract_address,
      name: name,
      chainId: SolanaChainId.Mainnet,
      symbol: collection.symbol,
      logoURL: collection.logo_url,
      tokensTotal: collection.items_total,
      verified: collection.verified,
      source: SourceType.NFTScan,
      type: SearchResultType.NonFungibleCollection,
      rank: rank,
      collection: {
        address: collection.contract_address,
        name: collection.name,
        chainId: SolanaChainId.Mainnet,
        iconURL: collection.logo_url,
        socialLinks: {
          website: collection.website,
          email: collection.email,
          twitter: collection.twitter,
          discord: collection.discord,
          telegram: collection.telegram,
          github: collection.github,
          instagram: collection.instagram,
          medium: collection.medium,
        },
      },
    } as NonFungibleCollection
  }

  async getCollection(address: string, chainId: string | number, rank: number, config: any) {
    const collectionURL = urlcat(baseURL, '/api/v2/collections/:contract_address', { contract_address: address })

    const collectionResult = await axios.get<CollectionResponse>(collectionURL, {
      headers: {
        'content-type': 'application/json',
        'x-app-chainid': chainId,
      },
    })

    await delay(1000)

    const collection = collectionResult.data.data

    return {
      pluginID: config.pluginID,
      address: collection.contract_address,
      name: collection.name,
      chainId: config.chainId,
      symbol: collection.symbol,
      logoURL: collection.logo_url,
      tokensTotal: collection.items_total,
      verified: collection.verified,
      source: SourceType.NFTScan,
      type: SearchResultType.NonFungibleCollection,
      rank: rank,
      collection: {
        address: collection.contract_address,
        name: collection.name,
        chainId: config.chainId,
        iconURL: collection.logo_url,
        socialLinks: {
          website: collection.website,
          email: collection.email,
          twitter: collection.twitter,
          discord: collection.discord,
          telegram: collection.telegram,
          github: collection.github,
          instagram: collection.instagram,
          medium: collection.medium,
        },
      },
    } as NonFungibleCollection
  }

  async getCollections(): Promise<NonFungibleCollection[]> {
    let result: NonFungibleCollection[] = []

    const chainId = config.chainId.toString()
    const url = urlcat(baseURL, '/api/v2/statistics/ranking/marketcap')

    const list = await axios.get<CollectionsRankingResponse>(url, {
      headers: {
        'content-type': 'application/json',
        'x-app-chainid': chainId,
      },
    })

    const data = orderBy(list.data.data, ['market_cap'], ['desc']).slice(0, config.limit)

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      try {
        const collection = await this.getCollection(item.contract_address, chainId, i + 1, config)
        if (collection) {
          result = [...result, collection]
        }
      } catch (e) {
        console.log(`Fetch error for ${config.chainId} ${item.contract_address} from nftscan`)
      }
    }

    return result
  }

  getProviderName(): SourceType {
    return SourceType.NFTScan
  }
}
