import axios from 'axios'
import { chunk } from 'lodash'
import urlcat from 'urlcat'
import { FungibleToken, FungibleTokenProvider, NetworkPluginID, SearchResultType, SourceType } from '../type'
import { getCoinMarketCapAPIKey } from '../utils'
import { joinName } from '../utils/misc'
import { isTaskError, parallelLimit } from '../utils/parallelLimit'

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
    const idChunks = chunk(ids, 200)
    const tasks = idChunks.map((chunk) => async () => {
      const metadataURL = urlcat(baseProURL, 'v2/cryptocurrency/info', {
        id: chunk.join(','),
        aux: 'urls,logo',
      })
      return axios.get<{ data: Record<string, CoinDetail> }>(metadataURL, {
        headers: { 'X-CMC_PRO_API_KEY': getCoinMarketCapAPIKey() },
      })
    })

    const results = await parallelLimit(tasks, 5)
    const data = results.flatMap((x) => (isTaskError(x) ? [] : x)).map((x) => x.data.data)
    // @ts-ignore
    return Object.assign(...data)
  }

  async getTopTokens(): Promise<FungibleToken[]> {
    const url = urlcat(baseProURL, 'v1/cryptocurrency/map', {
      sort: 'cmc_rank',
      limit: 2000,
    })
    console.time('CoinMarketCap: get top tokens')
    const res = await axios.get<Response>(url, {
      headers: { 'X-CMC_PRO_API_KEY': getCoinMarketCapAPIKey() },
    })

    const metadata = await this.getMetadata(res.data.data.map((x) => x.id))

    const result = res.data.data.map((x) => {
      return {
        pluginID: NetworkPluginID.PLUGIN_EVM,
        id: x.id,
        name: x.name,
        name_underscore: joinName(x.name, '_').toLowerCase(),
        name_connect: joinName(x.name, '').toLowerCase(),
        symbol: x.symbol,
        source: SourceType.CoinMarketCap,
        type: SearchResultType.FungibleToken,
        rank: x.rank,
        logoURL: metadata[x.id.toString()]?.logo,
        socialLinks: this.getSocialLinks(metadata[x.id.toString()]),
      } satisfies FungibleToken
    })
    console.timeEnd('CoinMarketCap: get top tokens')
    return result
  }

  getProviderName(): SourceType {
    return SourceType.CoinMarketCap
  }
}
