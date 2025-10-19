import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

function findConfigFile(folder: string) {
  const nodeEnv = process.env.NODE_ENV || 'development';
  // List of config files to try in priority order
  const configFiles = [
    // Local overrides (highest priority)
    'config.local.yaml',
    'config.local.yml',
    'config.local.json',
    // Environment-specific
    `config.${nodeEnv}.yaml`,
    `config.${nodeEnv}.yml`,
    `config.${nodeEnv}.json`,
    // Default config
    'config.yaml',
    'config.yml',
    'config.json',
  ];

  for (const filename of configFiles) {
    const filepath = join(folder, filename);

    if (existsSync(filepath)) {
      try {
        const content = readFileSync(filepath, 'utf8');

        let config: any;
        if (filename.endsWith('.json')) {
          config = JSON.parse(content);
        } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
          config = yaml.load(content);
        }

        if (config) {
          console.log(`✓ Loaded configuration from: ${filename}`);
          return config;
        }
      } catch (error) {
        console.error(`✗ Error loading configuration from ${filename}:`, error.message);
        // Continue to next file
      }
    }
  }
  return undefined;
}

/**
 * Loads configuration from YAML or JSON files
 * Priority order:
 * 1. config.local.yaml / config.local.json (for local overrides, gitignored)
 * 2. config.{NODE_ENV}.yaml / config.{NODE_ENV}.json (environment-specific)
 * 3. config.yaml / config.json (default config)
 * 4. Environment variables (fallback)
 */
export function loadConfigFile(): Record<string, any> | null {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const folder = process.cwd();
  let config = findConfigFile(folder);
  if (!config && folder.includes('/server')) {
    // Try parent folder if in /server (monorepo setup)
    config = findConfigFile(join(folder, '..'));
  }
  if (!config) {
    console.log('ℹ No configuration file found, using environment variables');
  }
  return config;
}

/**
 * Merges file config with environment variables
 * Environment variables take precedence over file config
 */
export function mergeConfig(
  fileConfig: Record<string, any> | null,
  envConfig: Record<string, any>,
): Record<string, any> {
  if (!fileConfig) {
    return envConfig;
  }

  // Deep merge: env vars override file config
  return deepMerge(fileConfig, envConfig);
}

/**
 * Deep merge two objects, with priority to the second object
 */
export function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') {
    return target;
  }

  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      // If both are objects (but not arrays), merge recursively
      if (
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue) &&
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        // Otherwise, source value takes precedence
        result[key] = sourceValue;
      }
    }
  }

  return result;
}
