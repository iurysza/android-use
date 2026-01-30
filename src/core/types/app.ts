/**
 * App identifier (package name)
 */
export type PackageName = string;

/**
 * Activity component (package/activity)
 */
export interface ActivityComponent {
  packageName: PackageName;
  activityName: string;
}

/**
 * Installed app info
 */
export interface AppInfo {
  packageName: PackageName;
  label?: string; // Human-readable name
  versionName?: string;
  versionCode?: number;
  isSystemApp: boolean;
  isEnabled: boolean;
}

/**
 * App launch options
 */
export interface LaunchOptions {
  /** Package name or app label */
  app: string;
  /** Specific activity to launch (optional) */
  activity?: string;
  /** Intent action (default: android.intent.action.MAIN) */
  action?: string;
  /** Wait for launch to complete */
  wait?: boolean;
  /** Clear app data before launch */
  clearData?: boolean;
}

/**
 * APK install options
 */
export interface InstallOptions {
  /** Path to APK file */
  apkPath: string;
  /** Replace existing app */
  replace?: boolean;
  /** Allow downgrade */
  downgrade?: boolean;
  /** Grant all permissions */
  grantPermissions?: boolean;
  /** Install on SD card */
  installOnSdCard?: boolean;
}

/**
 * Format activity component as string
 */
export function formatComponent(component: ActivityComponent): string {
  return `${component.packageName}/${component.activityName}`;
}

/**
 * Parse component string "pkg/activity"
 */
export function parseComponent(str: string): ActivityComponent | null {
  const parts = str.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return {
    packageName: parts[0],
    activityName: parts[1],
  };
}
