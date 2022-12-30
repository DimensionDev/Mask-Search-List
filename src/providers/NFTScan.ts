import axios from 'axios'
import urlcat from 'urlcat'
import {
  ChainId,
  NetworkPluginID,
  NonFungibleCollection,
  NonFungibleCollectionProvider,
  NonFungibleToken,
  NonFungibleTokenProvider,
  SearchResultType,
  SourceType,
} from '../type'

const baseURL = 'https://nftscan-proxy.r2d2.to'

const configs = [
  {
    chain: 'eth',
    chainId: ChainId.Mainnet,
    pluginID: NetworkPluginID.PLUGIN_EVM,
    url: 'https://restapi.nftscan.com',
    coin: 'ETH',
    limit: 500
  },
  {
    chain: 'bnb',
    chainId: ChainId.BNB,
    pluginID: NetworkPluginID.PLUGIN_EVM,
    url: 'https://bnbapi.nftscan.com',
    coin: 'BNB',
    limit: 500
  },
  {
    chain: 'polygon',
    chainId: ChainId.Polygon,
    pluginID: NetworkPluginID.PLUGIN_EVM,
    url: 'https://polygonapi.nftscan.com',
    coin: 'MATIC',
    limit: 500
  },
  // {
  //   chain: 'moonbeam',
  //   chainId: ChainId.Moonbeam,
  //   pluginID: NetworkPluginID.PLUGIN_EVM,
  //   url: 'https://restapi.nftscan.com',
  //   coin: 'GLMR',
  // },
  {
    chain: 'arbitrum',
    chainId: ChainId.Arbitrum,
    pluginID: NetworkPluginID.PLUGIN_EVM,
    url: 'https://arbitrumapi.nftscan.com',
    coin: 'ETH',
    limit: 200
  },
  {
    chain: 'optimism',
    chainId: ChainId.Optimistic,
    pluginID: NetworkPluginID.PLUGIN_EVM,
    url: 'https://optimismapi.nftscan.com',
    coin: 'ETH',
    limit: 200
  },
  // {
  //   chain: 'cronos',
  //   chainId: ChainId.xDai,
  //   pluginID: NetworkPluginID.PLUGIN_EVM,
  //   url: 'https://cronosapi.nftscan.com',
  //   coin: 'CRO',
  // },
  // {
  //   chain: 'avalanche',
  //   chainId: ChainId.Avalanche,
  //   pluginID: NetworkPluginID.PLUGIN_EVM,
  //   url: 'https://avaxapi.nftscan.com',
  //   coin: 'AVAX',
  // },
  // {
  //   chain: 'solana',
  //   chainId: ChainId.Mainnet,
  //   pluginID: NetworkPluginID.PLUGIN_SOLANA,
  //   url: 'https://solana.nftscan.com',
  //   coin: 'SOL',
  // },
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
      const url = urlcat(baseURL, '/api/v2/statistics/ranking/marketcap')
      const list = await axios.get<Response>(url, {
        headers: {
          'content-type': 'application/json',
          'x-app-chainid': config.pluginID === NetworkPluginID.PLUGIN_SOLANA ? 'solana' : config.chainId.toString(),
        },
      })

      const data = list.data.data.map(
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
      ).slice(0, config.limit)

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
      const url = urlcat(baseURL, '/api/v2/collections/rankings', {limit: config.limit ?? 1000})

      const list = await axios.get<CollectionResponse>(url, {
        headers: {
          'content-type': 'application/json',
          'x-app-chainid': config.pluginID === NetworkPluginID.PLUGIN_SOLANA ? 'solana' : config.chainId.toString(),
        },
      })

      const data = list.data.data.map(
        (x, index) =>
          ({
            pluginID: config.pluginID,
            address: x.contract_address,
            name: x.name,
            chainId: config.chainId,
            symbol: x.symbol,
            logoURL: x.logo_url,
            tokensTotal: x.items_total,
            verified: x.verified,
            source: SourceType.NFTScan,
            type: SearchResultType.NonFungibleCollection,
            rank: index + 1,
            collection: {
              address: x.contract_address,
              name: x.name,
              chainId: config.chainId,
              iconURL: x.logo_url,
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
