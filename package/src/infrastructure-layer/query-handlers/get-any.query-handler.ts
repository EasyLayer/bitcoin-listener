import { IQueryHandler, QueryHandler } from '@easylayer/components/cqrs';
import { GetAnyQuery } from '@easylayer/common/domain-cqrs-components/bitcoin-listener';
// import { ViewsReadRepositoryService } from '../services/views-read-repository.service';

@QueryHandler(GetAnyQuery)
export class GetAnyQueryHandler implements IQueryHandler<GetAnyQuery> {
  constructor() {} // private readonly viewsReadRepository: ViewsReadRepositoryService

  async execute({ payload }: GetAnyQuery): Promise<any> {
    const { prefix, coditions, relations } = payload;
    console.log(prefix, coditions, relations);
    // return this.viewsReadRepository.find();
  }
}
