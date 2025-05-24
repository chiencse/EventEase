import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';
import * as fs from 'fs'; 
import * as path from 'path';

export const databaseConfig: DataSourceOptions = {
  type: (process.env.DB_TYPE as any) || 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '18408'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: ['dist/**/*.entity.{ts,js}'],
  migrations: ['dist/database/migrations/*.js'],
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.resolve(__dirname, '../../ca.pem')).toString(), // Sử dụng path.resolve
  },
};

const dataSource = new DataSource(databaseConfig);
console.log('Database configuration:', databaseConfig);
export default dataSource;
