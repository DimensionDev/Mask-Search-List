import axios from 'axios'
import urlcat from 'urlcat'
import { chunk } from 'lodash'
import { getCoinMarketCapAPIKey } from '../utils'
import { FungibleToken, FungibleTokenProvider, NetworkPluginID, SearchResultType, SourceType } from '../type'

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

export type CoinDetail = {
  urls?: {
    website: string[]
    technical_doc: string[]
    twitter: string[]
    reddit: string[]
    message_board: string[]
    announcement: string[]
    chat: string[]
    explorer: string[]
    source_code: string[]
  }
  logo: string
  id: number
  name: string
  symbol: string
}

const baseProURL = 'https://pro-api.coinmarketcap.com/'

export class CoinMarketCap implements FungibleTokenProvider {
  private getSocialLinks(coin: CoinDetail) {
    return {
      website: coin.urls?.website?.[0],
      twitter: coin.urls?.twitter?.[0],
    }
  }
  private async getMetadata(ids: (string | number)[]) {
    const idsChunk = chunk(ids, 200)
    const reqs = idsChunk.map((x) => {
      const metadataURL = urlcat(baseProURL, 'v2/cryptocurrency/info', {
        id: x.join(),
        aux: 'urls,logo',
      })
      return axios.get<{ data: Record<string, CoinDetail> }>(metadataURL, {
        headers: { 'X-CMC_PRO_API_KEY': getCoinMarketCapAPIKey() },
      })
    })

    const result = await Promise.all(reqs)
    const data = result.map((x) => x.data.data)
    // @ts-ignore
    return Object.assign(...data)
  }

  async getTopTokens(): Promise<FungibleToken[]> {
    const url = urlcat(baseProURL, 'v1/cryptocurrency/map', {
      sort: 'cmc_rank',
      limit: 2000,
    })
    const res = await axios.get<Response>(url, {
      headers: { 'X-CMC_PRO_API_KEY': getCoinMarketCapAPIKey() },
    })

    const metadata = await this.getMetadata(res.data.data.map((x) => x.id))

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
          logoURL: metadata[x.id.toString()]?.logo,
          socialLinks: this.getSocialLinks(metadata[x.id.toString()]),
        } as FungibleToken),
    )
  }

  getProviderName(): SourceType {
    return SourceType.CoinMarketCap
  }
}
