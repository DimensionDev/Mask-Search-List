import axios from 'axios'
import urlcat from 'urlcat'
import {
  CoinGeckoNonFungibleToken,
  EVMChainId,
  FungibleToken,
  FungibleTokenProvider,
  NetworkPluginID,
  NonFungibleCollection,
  SearchResultType,
  SocialLinks,
  SourceType,
} from '../type'
import { delay } from '../utils'
import { guestChainByExplorer } from '../utils/misc'
import { isTaskError, parallelLimit, TaskError } from '../utils/parallelLimit'

export const baseURL = 'https://api.coingecko.com/api/v3'
export const baseProURL = 'https://coingecko-agent.r2d2.to/api/v3'

interface Coin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  ath: number
  ath_change_percentage: number
  ath_date: Date
  atl: number
  atl_change_percentage: number
  atl_date: Date
  roi?: string
  last_updated: Date
}

export type CoinDetail = {
  id: string
  symbol: string
  name: string
  asset_platform_id: string
  links?: {
    homepage: string[]
    blockchain_site: string[]
    official_forum_url: string[]
    chat_url: string[]
    announcement_url: string[]
    twitter_screen_name: string
    facebook_username: string
    bitcointalk_thread_identifier: string
    telegram_channel_identifier: string
    subreddit_url: string
    repos_url: {
      github: string[]
      bitbucket: string[]
    }
  }
  image: {
    thumb: string
    small: string
    large: string
  }
}

export interface MarketNFT {
  id: string
  contract_address: string
  asset_platform_id: string
  name: string
  symbol: string
  image: {
    small: string
    small_2x: string
  }
  description: string
  native_currency: string
  native_currency_symbol: string
  floor_price: {
    native_currency: number
    usd: number
  }
  market_cap: {
    native_currency: number
    usd: number
  }
  volume_24h: {
    native_currency: number
    usd: number
  }
  floor_price_in_usd_24h_percentage_change: number
  floor_price_24h_percentage_change: {
    usd: number
    native_currency: number
  }
  market_cap_24h_percentage_change: {
    usd: number
    native_currency: number
  }
  volume_24h_percentage_change: {
    usd: number
    native_currency: number
  }
  number_of_unique_addresses: number
  number_of_unique_addresses_24h_percentage_change: number
  volume_in_usd_24h_percentage_change: number
  total_supply: number
  one_day_sales: number
  one_day_sales_24h_percentage_change: number
  one_day_average_sale_price: number
  one_day_average_sale_price_24h_percentage_change: number
}

export interface NFTCollectionDetail {
  id: string
  web_slug: string
  contract_address: string
  asset_platform_id: string
  name: string
  symbol: string
  image: {
    small: string
    small_2x: string
  }
  small: string
  small_2x: string
  description: string
  native_currency: string
  native_currency_symbol: string
  market_cap_rank: number
  floor_price: {
    native_currency: number
    usd: number
  }
  market_cap: {
    native_currency: number
    usd: number
  }
  volume_24h: {
    native_currency: number
    usd: number
  }
  floor_price_in_usd_24h_percentage_change: number
  floor_price_24h_percentage_change: {
    usd: number
    native_currency: number
  }
  market_cap_24h_percentage_change: {
    usd: number
    native_currency: number
  }
  volume_24h_percentage_change: {
    usd: number
    native_currency: number
  }
  number_of_unique_addresses: number
  number_of_unique_addresses_24h_percentage_change: number
  volume_in_usd_24h_percentage_change: number
  total_supply: number
  one_day_sales: number
  one_day_sales_24h_percentage_change: number
  one_day_average_sale_price: number
  one_day_average_sale_price_24h_percentage_change: number
  links: {
    homepage: string
    twitter: string
    discord: string
  }
  floor_price_7d_percentage_change: {
    usd: number
    native_currency: number
  }
  floor_price_14d_percentage_change: {
    usd: number
    native_currency: number
  }
  floor_price_30d_percentage_change: {
    usd: number
    native_currency: number
  }
  floor_price_60d_percentage_change: {
    usd: number
    native_currency: number
  }
  floor_price_1y_percentage_change: {
    usd: number
    native_currency: number
  }
  explorers: Array<{ name: string; link: string }>
  user_favorites_count: number
  ath: {
    native_currency: number
    usd: number
  }
  ath_change_percentage: {
    native_currency: number
    usd: number
  }
  ath_date: {
    native_currency: string
    usd: string
  }
}

export class CoinGecko implements FungibleTokenProvider {
  private getSocialLinks(coin: CoinDetail) {
    // CoinGecko provided more info.
    return {
      website: coin.links?.homepage?.[0],
      twitter: coin.links?.twitter_screen_name,
      telegram: coin.links?.telegram_channel_identifier,
    }
  }

  private async getMetadata(ids: (string | number)[]) {
    const result: Record<string, SocialLinks> = {}
    for (const id of ids) {
      try {
        const metadataURL = urlcat(baseProURL, '/coins/:id', {
          id,
          localization: false,
          tickers: false,
          market_data: false,
          developer_data: false,
          sparkline: false,
        })
        const tokenInfo = await axios.get<CoinDetail>(metadataURL)
        result[id] = this.getSocialLinks(tokenInfo.data)
      } catch (e) {
        console.log(`CoinGecko get ${id} coin info failed`)
      }
      await delay(300)
    }

    return result
  }

  async getTopTokens(): Promise<FungibleToken[]> {
    const result: FungibleToken[] = []
    while (result.length < 2000) {
      const requestURL = urlcat(baseURL, '/coins/markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 250,
        page: Math.ceil(result.length / 250),
      })
      const list = await axios.get<Coin[]>(requestURL)

      console.log(`CoinGecko: fetched the ${result.length / 250} page token, the list length is: ${list.data.length}`)

      if (!list.data.length) break
      const links = await this.getMetadata(list.data.map((x) => x.id))

      result.push(
        ...list.data.map((x) => ({
          pluginID: NetworkPluginID.PLUGIN_EVM,
          id: x.id,
          symbol: x.symbol,
          name: x.name,
          source: SourceType.CoinGecko,
          type: SearchResultType.FungibleToken,
          logoURL: x.image,
          rank: x.market_cap_rank,
          socialLinks: links[x.id],
        })),
      )

      await delay(6000)
    }

    return result
  }

  async getCollectionDetail(id: string): Promise<NFTCollectionDetail> {
    const url = urlcat(baseProURL, '/nfts/:id', { id })
    const res = await axios.get<NFTCollectionDetail>(url)
    return res.data
  }

  async getNFTDetails(ids: string[]): Promise<Record<string, NFTCollectionDetail | TaskError>> {
    const tasks = ids.map((id) => () => this.getCollectionDetail(id))
    const results = await parallelLimit(tasks, 5)

    return Object.fromEntries(results.map((x, i) => [ids[i], x]))
  }

  async getTopNFT(): Promise<NonFungibleCollection[]> {
    const result: NonFungibleCollection[] = []
    while (result.length < 400) {
      const page = Math.ceil(result.length / 200)
      const requestURL = urlcat(baseProURL, '/nfts/markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 200,
        page,
      })
      const list = await axios.get<MarketNFT[]>(requestURL)

      console.log(`CoinGecko: fetched the ${page} page nft collection, the list length is ${list.data.length}`)

      if (!list.data.length) break
      const details = await this.getNFTDetails(list.data.map((x) => x.id))

      result.push(
        ...list.data.map((x) => {
          const mix = details[x.id]
          const detail = isTaskError(mix) ? null : mix
          const chainId = guestChainByExplorer(detail?.explorers?.[0]?.link) || EVMChainId.Mainnet
          return {
            pluginID: NetworkPluginID.PLUGIN_EVM,
            chainId,
            id: x.id,
            address: x.contract_address,
            name: x.name,
            logoURL: x.image.small_2x || x.image.small,
            slug: detail?.web_slug,
            symbol: x.symbol,
            description: x.description,
            source: SourceType.CoinGecko,
            type: SearchResultType.NonFungibleToken,
            rank: detail?.market_cap_rank,
            collection: {
              chainId,
              name: x.name,
              symbol: x.symbol,
              address: x.contract_address,
              iconURL: x.image.small_2x || x.image.small,
              socialLinks: detail?.links || {},
            },
          }
        }),
      )

      await delay(6000)
    }

    return result
  }

  getProviderName(): SourceType {
    return SourceType.CoinGecko
  }
}
