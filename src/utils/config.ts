export function getCoinMarketCapAPIKey() {
  return process.env.COINMARKETCAP_API_KEY
}

export function getRuntimeEnableCache() {
  const enableEnv = process.env.RUNTIME_ENABLE_CACHE ?? 'true'
  return typeof enableEnv === 'string' ? enableEnv === 'true' : enableEnv
}
