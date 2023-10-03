import mockAxios from "../../../__mocks__/mockAxios";
import { _getContract } from "../../../__mocks__/services/ContractService";
import { _deleteProject, _getProject } from "../../../__mocks__/services/ProjectService";
import { _getRequest, _updateRequest } from "../../../__mocks__/services/RequestService";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { deleteTargetProject, getContractingProjectDetail, getTargetProject } from "../../../src/usecases/project/CommonProjectCase";
import { UpdateRequestIsApproveParam, updateRequestIsApproval } from "../../../src/usecases/request/CommonRequestCase";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory();
});

const getRequestUrl = __getEmulatorFunctionsURI('IRequest-getRequest')
const updateRequestUrl = __getEmulatorFunctionsURI('IRequest-updateRequest')

let params: UpdateRequestIsApproveParam = {
    requestId: 'request-id',
    isApproval: true
}
describe('updateRequestIsApproval case', () => {
    
    it('requestId = undefined test', async() => {
        const res = await updateRequestIsApproval({ requestId: undefined })
        expect(res.error).toEqual(`requestId: undefined, isApproval: undefined, 情報が足りません`)
    })

    it('success test', async() => {

        _getRequest({
            requestId: 'request-id' 
        })
        _updateRequest({
            request: {
                requestId: 'request-id',
                isApproval: params.isApproval || true
            }
        })
        const res = await updateRequestIsApproval(params)
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getRequestUrl);
        expect(mockAxios.history.post[1].url).toEqual(updateRequestUrl);
        expect(res.success).toEqual(true)
      })

    it('error test', async () => {
        mockAxios.onPost(getRequestUrl).networkError();

        const res = await updateRequestIsApproval(params)

        expect(mockAxios.history.post[0].url).toEqual(getRequestUrl);
        expect(res.error).toEqual('Network Error');
      })

})