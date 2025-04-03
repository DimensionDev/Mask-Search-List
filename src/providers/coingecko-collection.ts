import axios from 'axios'
import urlcat from 'urlcat'
import {
  EVMChainId,
  NetworkPluginID,
  NonFungibleCollection,
  NonFungibleCollectionProvider,
  SearchResultType,
  SourceType,
} from '../type'
import { delay } from '../utils'
import { guestChainByExplorer, joinName } from '../utils/misc'
import { isTaskError, parallelLimit, TaskError } from '../utils/parallelLimit'

export const baseURL = 'https://api.coingecko.com/api/v3'
export const baseProURL = 'https://coingecko-agent.r2d2.to/api/v3'

export interface MarketCollection {
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

export interface CollectionDetail {
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

export class CoinGeckoCollection implements NonFungibleCollectionProvider {
  async getCollectionDetail(id: string): Promise<CollectionDetail> {
    const url = urlcat(baseProURL, '/nfts/:id', { id })
    const res = await axios.get<CollectionDetail>(url)
    return res.data
  }

  async getCollectionDetails(ids: string[]): Promise<Record<string, CollectionDetail | TaskError>> {
    console.time('CoinGecko: get collection details')
    const tasks = ids.map((id) => () => this.getCollectionDetail(id))
    const results = await parallelLimit(tasks, 10)
    console.timeEnd('CoinGecko: get collection details')

    return Object.fromEntries(results.map((x, i) => [ids[i], x]))
  }

  async getCollections(): Promise<NonFungibleCollection[]> {
    const result: NonFungibleCollection[] = []
    while (result.length < 400) {
      const page = Math.ceil(result.length / 200)
      const requestURL = urlcat(baseProURL, '/nfts/markets', {
        vs_currency: 'usd',
        per_page: 200,
        page,
      })
      const list = await axios.get<MarketCollection[]>(requestURL)

      console.log(`CoinGecko: fetched the ${page} page nft collection, the list length is ${list.data.length}`)

      if (!list.data.length) break
      const details = await this.getCollectionDetails(list.data.map((x) => x.id))

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
            name_underscore: joinName(x.name, '_'),
            name_connect: joinName(x.name, ''),
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
          } satisfies NonFungibleCollection
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
