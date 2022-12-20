import { FungibleToken, FungibleTokenProvider, NetworkPluginID, SearchResultType, SourceType } from '../type'
import axios from 'axios'
import urlcat from 'urlcat'
import { getCoinMarketCapAPIKey } from '../utils'

export interface IDInfo {
  id: number
  name: string
  symbol: string
  slug: string
  rank: number
  displayTV: number
  is_active: number
  first_historical_data: string
  last_historical_data: string
  platform: Platform
}

export interface Response {
  data: IDInfo[]
}

export interface Platform {
  id: string
  name: string
  symbol: string
  slug: string
  token_address: string
}
const baseProURL = 'https://pro-api.coinmarketcap.com/'

export class CoinMarketCap implements FungibleTokenProvider {
  async getTopTokens(): Promise<FungibleToken[]> {
    const url = urlcat(baseProURL, 'v1/cryptocurrency/map', {
      sort: 'cmc_rank',
      limit: 2000,
    })
    const res = await axios.get<Response>(url, {
      headers: { 'X-CMC_PRO_API_KEY': getCoinMarketCapAPIKey() },
    })

    return res.data.data.map(
      (x) =>
        ({
          pluginID: NetworkPluginID.PLUGIN_EVM,
          id: x.id,
          name: x.name,
          symbol: x.symbol,
          source: SourceType.CoinMarketCap,
          type: SearchResultType.FungibleToken,
          rank: x.rank,
        } as FungibleToken),
    )
  }

  getProviderName(): SourceType {
    return SourceType.CoinMarketCap
  }
}
