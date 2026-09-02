import packageJson from "../package.json";

export const APP_NAME = "FinTrack";
export const APP_VERSION = packageJson.version;
export const APP_DESCRIPTION = packageJson.description ?? "Indian Personal Finance PWA";

export function getVersionLabel() {
  return `v${APP_VERSION}`;
}

export function getFullVersionLabel() {
  return `${APP_NAME} ${getVersionLabel()}`;
}
