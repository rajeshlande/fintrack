// Version Management for FinTrack
// Single source of truth for app version information

export const appConfig = {
  appName: 'FinTrack',
  version: '0.0.39',
  buildDate: new Date().toISOString(), // ISO 8601 format in UTC
}

export const { appName, version, buildDate } = appConfig

// Helper function to get formatted version string
export function getVersionString(): string {
  return `${appName} v${version}`
}

// Helper function to get build date in local timezone
export function getBuildDateLocal(): string {
  return new Date(buildDate).toLocaleString()
}
