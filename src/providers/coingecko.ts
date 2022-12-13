import axios from 'axios'
import { FungibleToken, FungibleTokenProvider, NetworkPluginID, SearchResultType, SourceType } from '../type'
import urlcat from 'urlcat'
import { delay } from '../utils'

export const baseURL = 'https://api.coingecko.com/api/v3'

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
  roi?: any
  last_updated: Date
}

export class CoinGecko implements FungibleTokenProvider {
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

      result.push(
        ...list.data.map((x) => ({
          pluginID: NetworkPluginID.PLUGIN_EVM,
          id: x.id,
          symbol: x.symbol,
          name: x.name,
          source: SourceType.CoinGecko,
          type: SearchResultType.FungibleToken,
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
