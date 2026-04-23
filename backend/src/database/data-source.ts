import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join, resolve } from 'path';
import { User } from '../auth/entities/user.entity';

loadEnv({ path: resolve(process.cwd(), '../.env') });
loadEnv({ path: resolve(process.cwd(), '.env') });

function resolveVariableReference(
  value: string | undefined,
): string | undefined {
  if (!value) {
    return value;
  }
  const match = value.match(/^\$\{(.+)\}$/);
  if (!match) {
    return value;
  }
  const referencedValue = process.env[match[1]];
  return referencedValue || value;
}

function getEnvValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const rawValue = process.env[key];
    const resolvedValue = resolveVariableReference(rawValue);
    if (resolvedValue) {
      return resolvedValue;
    }
  }
  return undefined;
}

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: getEnvValue('DATABASE_HOST') || 'localhost',
  port: parseInt(getEnvValue('DATABASE_PORT') || '5432', 10),
  username: getEnvValue('DATABASE_USER', 'POSTGRES_USER') || 'technical-test',
  password: getEnvValue('DATABASE_PASSWORD', 'POSTGRES_PASSWORD') || '',
  database: getEnvValue('DATABASE_NAME', 'POSTGRES_DB') || 'technical-test_db',
  entities: [User],
  migrations: [join(__dirname, '/../migrations/*{.ts,.js}')],
  synchronize: false,
  logging: getEnvValue('NODE_ENV') !== 'production',
};

export default new DataSource(dataSourceOptions);
