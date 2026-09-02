/** Props that reduce browser extension DOM injection on auth forms */
export const extensionSafeFormProps = {
  "data-gramm": "false",
  "data-gramm_editor": "false",
  "data-enable-grammarly": "false",
  "data-lpignore": "true",
  suppressHydrationWarning: true,
} as const;

export const extensionSafeInputProps = {
  "data-gramm": "false",
  "data-1p-ignore": "true",
  suppressHydrationWarning: true,
} as const;
