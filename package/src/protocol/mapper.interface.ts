import { BaseViewModel } from './base-view-model';

export type MapperType = new () => IListenerMapper;

export interface IListenerMapper {
  handle(data: any): Promise<BaseViewModel | BaseViewModel[]>;
  reorganisation(data: any): Promise<BaseViewModel | BaseViewModel[]>;
}
