import { Injectable } from '@nestjs/common';
import { Repository } from '@easylayer/components/views-keyvalue-db';

type Bytes = string | Buffer;
type Operations = Array<{ method: string; key: Bytes; value?: Bytes }>;

@Injectable()
export class ViewsWriteRepositoryService {
  private operations: Operations = [];

  constructor(private readonly repository: Repository) {}

  public add(models: any[]) {
    models.forEach((model) => {
      // const entityName = model.constructor.name;
      const operationsHistory = model.getOperationsHistory();

      for (const operation of operationsHistory) {
        const { method, params } = operation;
        this.addOperation(method, params);
      }
    });
  }

  public addOperation(method: string, params: any) {
    this.operations.push({ method, key: params.key, value: params?.values?.value });
  }

  public async put(key: Bytes, value: any) {
    await this.repository.put(key, value);
  }

  public async del(key: Bytes) {
    await this.repository.del(key);
  }

  public async commit(): Promise<void> {
    if (this.operations.length === 0) {
      throw new Error('No operations to commit');
    }

    const batch = this.repository.batch();

    this.operations.forEach((operation) => {
      const { method, key, value } = operation;

      if (method === 'put' && value !== undefined) {
        this.put(key, value);
      } else if (method === 'del') {
        this.del(key);
      }
    });

    // Execute batch as a transaction
    return new Promise((resolve, reject) => {
      batch.write((err: any) => {
        if (err) {
          this.clearOperations();
          return reject(err);
        }
        this.clearOperations();
        resolve();
      });
    });
  }

  private clearOperations(): void {
    this.operations = [];
  }
}
