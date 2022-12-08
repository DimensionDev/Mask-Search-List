import axios from 'axios'
import urlcat from 'urlcat'
import {
  NonFungibleCollection,
  NonFungibleCollectionProvider,
  NonFungibleToken,
  NonFungibleTokenProvider,
  SearchResultType,
  SourceType,
} from '../type'

const configs = [
  { chain: 'eth', url: 'https://restapi.nftscan.com', coin: 'ETH' },
  { chain: 'bnb', url: 'https://bnbapi.nftscan.com', coin: 'BNB' },
  { chain: 'polygon', url: 'https://restapi.nftscan.com', coin: 'MATIC' },
  { chain: 'moonbeam', url: 'https://restapi.nftscan.com', coin: 'GLMR' },
  { chain: 'arbitrum', url: 'https://restapi.nftscan.com', coin: 'ETH' },
  { chain: 'optimism', url: 'https://restapi.nftscan.com', coin: 'ETH' },
  { chain: 'platon', url: 'https://restapi.nftscan.com', coin: 'LAT' },
  { chain: 'avalanche', url: 'https://restapi.nftscan.com', coin: 'AVAX' },
  { chain: 'solana', url: 'https://restapi.nftscan.com', coin: 'SOL' },
]

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
  data: Array<{
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
  }>
}

export class NFTScanToken implements NonFungibleTokenProvider {
  async getTopTokens() {
    let result: NonFungibleToken[] = []

    for (let config of configs) {
      const url = urlcat(config.url, '/api/v2/statistics/ranking/marketcap')
      const list = await axios.get<Response>(url, { headers: { 'X-API-KEY': "___KEY___" } })

      const data = list.data.data.map(
        (x) =>
          ({
            address: x.contract_address,
            name: x.contract_name,
            chain: config.chain,
            type: SearchResultType.NonFungibleToken,
            source: SourceType.NFTScan
          } as NonFungibleToken),
      )

      result = [...result, ...data]
    }

    return result
  }

  getProviderName(): SourceType {
    return SourceType.NFTScan
  }
}

export class NFTScanCollection implements NonFungibleCollectionProvider {
  async getCollections(): Promise<NonFungibleCollection[]> {
    let result: NonFungibleCollection[] = []

    for (let config of configs) {
      const url = urlcat(config.url, '/api//v2/collections/rankings', { limit: 1000 })
      const list = await axios.get<CollectionResponse>(url, { headers: { 'X-API-KEY': '__KEY___' } })

      const data = list.data.data.map(
        (x) =>
          ({
            address: x.contract_address,
            name: x.name,
            chainId: config.chain,
            symbol: x.symbol,
            iconURL: x.logo_url,
            tokensTotal: x.items_total,
            verified: x.verified,
            source: SourceType.NFTScan,
            type: SearchResultType.NonFungibleCollection,
            socialLinks: {
              website: x.website,
              email: x.email,
              twitter: x.twitter,
              discord: x.discord,
              telegram: x.telegram,
              github: x.github,
              instagram: x.instagram,
              medium: x.medium,
            },
          } as NonFungibleCollection),
      )

      result = [...result, ...data]
    }

    return result
  }

  getProviderName(): SourceType {
    return SourceType.NFTScan
  }
}
