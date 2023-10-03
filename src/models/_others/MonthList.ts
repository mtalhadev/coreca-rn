import { ID } from './ID';
import { TotalSeconds } from './TotalSeconds';

export type monthListModel = Partial<{
    month: TotalSeconds;
    id: ID;
}>;
