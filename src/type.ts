export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Optimistic = 10,
  Kardiachain = 24,
  Cronos = 25,
  BNB = 56,
  Sokol = 77,
  Chapel = 97,
  xDai = 100,
  Fuse = 122,
  Heco = 128,
  Fantom = 250,
  Boba = 288,
  Polygon = 137,
  Mumbai = 80001,
  Stardust = 588,
  Astar = 592,
  Conflux = 1030,
  Metis = 1088,
  Moonbeam = 1284,
  Moonriver = 1285,
  Arbitrum = 42161,
  Celo = 42220,
  Avalanche = 43114,
  Aurora = 1313161554,
  Harmony = 1666600000,
  Harmony_Testnet = 1666700000,
  Palm = 11297108109,
}

/**
 * All integrated network Plugin IDs
 */
export enum NetworkPluginID {
  PLUGIN_EVM = 'com.mask.evm',
  PLUGIN_FLOW = 'com.mask.flow',
  PLUGIN_SOLANA = 'com.mask.solana',
}

export enum SearchResultType {
  // e.g., 0xd8da6bf26964af9d7eed9e03e53415d37aa96045
  Address = 'Address',
  // e.g., vitalik.eth or vitalik.bnb
  Domain = 'Domain',
  // e.g., $MASK #MASK
  FungibleToken = 'FungibleToken',
  // e.g., $PUNK #PUNK
  NonFungibleToken = 'NonFungibleToken',
  // e.g., $PUNK #PUNK
  NonFungibleCollection = 'NonFungibleCollection',
}

export enum SourceType {
  // FT assets
  DeBank = 'DeBank',
  Zerion = 'Zerion',
  Flow = 'Flow',
  Solana = 'Solana',
  CoinGecko = 'CoinGecko',
  CoinMarketCap = 'CoinMarketCap',
  UniswapInfo = 'UniswapInfo',
  CF = 'CloudFlare',
  GoPlus = 'GoPlus',

  // NFT assets
  Rabby = 'Rabby',
  Gem = 'Gem',
  RSS3 = 'RSS3',
  Zora = 'zora',
  OpenSea = 'opensea',
  Rarible = 'rarible',
  LooksRare = 'looksrare',
  NFTScan = 'NFTScan',
  Alchemy_EVM = 'Alchemy_EVM',
  Alchemy_FLOW = 'Alchemy_FLOW',
  Chainbase = 'Chainbase',
  X2Y2 = 'X2Y2',
  MagicEden = 'MagicEden',
  Element = 'Element',
  Solsea = 'Solsea',
  Solanart = 'Solanart',

  // Rarity
  RaritySniper = 'RaritySniper',
  TraitSniper = 'TraitSniper',

  // Token List
  R2D2 = 'R2D2',
}

export interface FungibleToken {
  pluginID: NetworkPluginID
  id: string | number
  name: string
  symbol: string
  logoURL: string
  source: SourceType
  type: SearchResultType
  rank: number
}

export interface NonFungibleToken {
  pluginID: NetworkPluginID
  address: string
  name: string
  iconURL?: string
  chainId: ChainId
  source: SourceType
  type: SearchResultType
  rank: number
}

export interface NonFungibleCollection {
  pluginID: NetworkPluginID
  chainId: ChainId
  name: string
  logoURL: string
  slug?: string
  symbol?: string
  description?: string
  address?: string
  iconURL?: string | null
  /** the amount of mint tokens */
  tokensTotal?: number
  /** the amount of holders */
  ownersTotal?: number
  /** verified by provider */
  verified?: boolean
  /** unix timestamp */
  createdAt?: number
  /** source type */
  source: SourceType
  type: SearchResultType
  rank: number
  collection: {
    chainId: ChainId
    name: string
    symbol?: string
    address?: string
    iconURL?: string | null
    socialLinks: {
      website?: string
      email?: string
      twitter?: string
      discord?: string
      telegram?: string
      github?: string
      instagram?: string
      medium?: string
    }
  }
}

export interface FungibleTokenProvider {
  getTopTokens(): Promise<FungibleToken[]>
  getProviderName(): SourceType
}

export interface NonFungibleTokenProvider {
  getTopTokens(): Promise<NonFungibleToken[]>
  getProviderName(): SourceType
}

export interface NonFungibleCollectionProvider {
  getCollections(): Promise<NonFungibleCollection[]>
  getProviderName(): SourceType
}
