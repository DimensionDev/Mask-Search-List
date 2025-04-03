export enum EVMChainId {
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

const explorerToChain: Record<string, EVMChainId> = {
  'etherscan.io': EVMChainId.Mainnet,
  'ropsten.etherscan.io': EVMChainId.Ropsten,
  'rinkeby.etherscan.io': EVMChainId.Rinkeby,
  'optimistic.etherscan.io': EVMChainId.Optimistic,
  'cronos.org': EVMChainId.Cronos,
  'polygonscan.com': EVMChainId.Polygon,
  'explorer.kardia.io': EVMChainId.Kardiachain,
  'bscscan.com': EVMChainId.BNB,
  'testnet.bscscan.com': EVMChainId.BNB,
  'explorer.xdaichain.com': EVMChainId.xDai,
  'explorer.fuse.io': EVMChainId.Fuse,
  'hecoinfo.com': EVMChainId.Heco,
}
export function guestChainByExplorer(link: string | undefined) {
  if (!link || !URL.canParse(link)) return null
  const url = new URL(link)
  return explorerToChain[url.host] || null
}

export function joinName(name: string, sep: '_' | '') {
  return name.replace(/\s+/g, sep)
}
