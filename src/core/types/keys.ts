/**
 * Common Android keycodes
 * Full list: https://developer.android.com/reference/android/view/KeyEvent
 */
export const KEYCODES = {
  // Navigation
  HOME: 3,
  BACK: 4,
  MENU: 82,
  APP_SWITCH: 187, // Recent apps

  // Power & Volume
  POWER: 26,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  VOLUME_MUTE: 164,

  // D-pad
  DPAD_UP: 19,
  DPAD_DOWN: 20,
  DPAD_LEFT: 21,
  DPAD_RIGHT: 22,
  DPAD_CENTER: 23,

  // Actions
  ENTER: 66,
  TAB: 61,
  SPACE: 62,
  DEL: 67, // Backspace
  FORWARD_DEL: 112,
  ESCAPE: 111,

  // Media
  MEDIA_PLAY: 126,
  MEDIA_PAUSE: 127,
  MEDIA_PLAY_PAUSE: 85,
  MEDIA_STOP: 86,
  MEDIA_NEXT: 87,
  MEDIA_PREVIOUS: 88,

  // Camera
  CAMERA: 27,
  FOCUS: 80,

  // Misc
  SEARCH: 84,
  SETTINGS: 176,
  NOTIFICATION: 83,
  WAKEUP: 224,
  SLEEP: 223,
} as const;

/**
 * Keycode type (numeric value)
 */
export type Keycode = (typeof KEYCODES)[keyof typeof KEYCODES];

/**
 * Named key (string alias)
 */
export type KeyName = keyof typeof KEYCODES;

/**
 * Resolve key name or code to numeric keycode
 */
export function resolveKeycode(key: KeyName | number): number {
  if (typeof key === "number") {
    return key;
  }
  const code = KEYCODES[key];
  if (code === undefined) {
    throw new Error(`Unknown key name: ${key}`);
  }
  return code;
}

/**
 * Check if value is a valid key name
 */
export function isKeyName(value: string): value is KeyName {
  return value in KEYCODES;
}
