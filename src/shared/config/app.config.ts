import { APP_DEFAULTS, APP_META } from "@/shared/constants";
import { env } from "@/shared/config/env";

export interface AppConfig {
  readonly name: string;
  readonly version: string;
  readonly defaultLanguage: string;
  readonly defaultTheme: string;
  readonly multiTenant: boolean;
  readonly environment: string;
  readonly debug: boolean;
}

export const appConfig: AppConfig = {
  name: APP_META.name,
  version: APP_META.version,
  defaultLanguage: APP_DEFAULTS.language,
  defaultTheme: APP_DEFAULTS.theme,
  multiTenant: true,
  environment: env.mode,
  debug: !env.isProduction,
};
