import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';
import { ID } from '../_others/ID';
import { ConstructionListType } from './ConstructionListType';
import { ContractType } from '../contract/Contract';

/**
 * 案件詳細の工事一覧データを保存。SSG用
 */
export type ContractingProjectConstructionListModel = Partial<{
    contractingProjectConstructionListId: ID
    companyId: ID
    contractId: ID
    contract: ContractType
    constructions: ConstructionListType
}> & CommonModel;

export const initContractingProjectConstructionList = (contractingProjectConstructionList: Create<ContractingProjectConstructionListModel> | Update<ContractingProjectConstructionListModel>): Update<ContractingProjectConstructionListModel> => {
    const newContractingProjectConstructionList: Update<ContractingProjectConstructionListModel> = {
        contractingProjectConstructionListId: contractingProjectConstructionList.contractingProjectConstructionListId,
        companyId: contractingProjectConstructionList.companyId,
        contractId: contractingProjectConstructionList.contractId,
        contract: contractingProjectConstructionList.contract,
        constructions: contractingProjectConstructionList.constructions,
    };
    return newContractingProjectConstructionList;
};

/**
 * {@link ContractingProjectConstructionListOptionInputParam - 説明}
 */
export type ContractingProjectConstructionListOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ContractingProjectConstructionListOptionParam>,
    {
        // 
    }
>;

export type GetContractingProjectConstructionListOptionParam = GetOptionParam<ContractingProjectConstructionListType, ContractingProjectConstructionListOptionParam, ContractingProjectConstructionListOptionInputParam>;

/**
 * 
 */
export type ContractingProjectConstructionListOptionParam = {
    // 
};

export type ContractingProjectConstructionListType = ContractingProjectConstructionListModel & ContractingProjectConstructionListOptionParam;