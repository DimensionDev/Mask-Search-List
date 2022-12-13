import { FungibleToken, FungibleTokenProvider, NetworkPluginID, SearchResultType, SourceType } from '../type'
import axios from 'axios'
import urlcat from 'urlcat'

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
const baseProURL = 'https://coinmarketcap-agent.r2d2.to'

export class CoinMarketCap implements FungibleTokenProvider {
  async getTopTokens(): Promise<FungibleToken[]> {
    const url = urlcat(baseProURL, 'v1/cryptocurrency/map', {
      sort: 'cmc_rank',
      limit: 2000,
    })
    const res = await axios.get<Response>(url)

    return res.data.data.map(
      (x) =>
        ({
          pluginID: NetworkPluginID.PLUGIN_EVM,
          id: x.id,
          name: x.name,
          symbol: x.symbol,
          source: SourceType.CoinMarketCap,
          type: SearchResultType.FungibleToken,
        } as FungibleToken),
    )
  }

  getProviderName(): SourceType {
    return SourceType.CoinMarketCap
  }
}
