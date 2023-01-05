export function getCoinMarketCapAPIKey() {
  return process.env.COINMARKETCAP_API_KEY
}

export enum RuntimeTarget {
  All = 'all',
  FungibleTokens = 'fungible-tokens',
  NonFungibleTokens = 'non-fungible-tokens',
  NonFungibleCollections = 'non-fungible-collections',
}

export function getRuntimeTarget() {
  const target = process.env.RUNTIME_TARGET ?? 'all'
  return target as RuntimeTarget
}

export function enableBuild(type: 'fungible-tokens' | 'non-fungible-tokens' | 'non-fungible-collections') {
  const target = getRuntimeTarget()
  if (target === RuntimeTarget.All) return true
  return type === target
}

export function getRuntimeEnableCache() {
  const enable = process.env.RUNTIME_ENABLE_CACHE ?? true
  return enable as boolean
}
