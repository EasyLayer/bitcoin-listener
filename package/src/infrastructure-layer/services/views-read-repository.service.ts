import { Injectable } from '@nestjs/common';
import { Repository } from '@easylayer/components/views-keyvalue-db';

@Injectable()
export class ViewsReadRepositoryService {
  constructor(private readonly repository: Repository) {}

  public async getAllByPrefix<T = any>(prefix: string): Promise<Array<{ key: string; value: T | null }>> {
    return new Promise((resolve, reject) => {
      const results: any = [];
      const iterator = this.repository.connection.iterator({
        gte: prefix,
        lte: `${prefix}\xFF`, // Prefix with maximum value for range
      });
      function next() {
        iterator.next((err: any, key: any, value: any) => {
          if (err) {
            return reject(err);
          }

          if (key === undefined && value === undefined) {
            // Completing iteration
            return resolve(results);
          }

          const resultKey = key.toString();
          let resultValue: T | null = null;

          if (value) {
            const valueStr = value.toString();

            if (valueStr.trim() === '') {
              // Пустая строка
              resultValue = null;
            } else {
              // Пытаемся разобрать как JSON
              resultValue = JSON.parse(valueStr);
            }
          }

          results.push({ key: resultKey, value: resultValue });

          next();
        });
      }

      next();
    });
  }

  public async getByFulKey(key: string) {
    return this.repository.get(key);
  }
}
