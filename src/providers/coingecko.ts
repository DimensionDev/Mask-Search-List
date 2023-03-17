import axios from 'axios'
import urlcat from 'urlcat'
import {
  FungibleToken,
  FungibleTokenProvider,
  NetworkPluginID,
  SearchResultType,
  SocialLinks,
  SourceType,
} from '../type'
import { delay } from '../utils'

export const baseURL = 'https://api.coingecko.com/api/v3'
export const baseProURL = 'https://coingecko-agent.r2d2.to'

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
        const metadataURL = urlcat(baseProURL, '/api/v3/coins/:id', {
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

      console.log(`Fetched the ${result.length / 250} page data, the list length is: ${list.data.length}`)

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

  getProviderName(): SourceType {
    return SourceType.CoinGecko
  }
}
