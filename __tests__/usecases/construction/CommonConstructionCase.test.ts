import mockAxios from "../../../__mocks__/mockAxios";
import { _deleteConstruction, _getConstruction } from "../../../__mocks__/services/ConstructionService";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { deleteTargetConstruction, getTargetConstruction } from "../../../src/usecases/construction/CommonConstructionCase";
 
afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory()
});

let constructionId='construction-id', 
myCompanyId='my-company-id', 
workerId='worker-id',
myWorkerId='worker-id';

const getConstructionUrl = __getEmulatorFunctionsURI('IConstruction-getConstruction')
const deleteConstructionUrl = __getEmulatorFunctionsURI('IConstruction-deleteConstruction')

describe('getTargetConstruction case', () => {
    
    it('constructionId = undefined test', async() => {
        const res = await getTargetConstruction({ constructionId: undefined, myCompanyId: undefined  })
        expect(res.error).toEqual('idが足りません。')
    })

    it('success test', async() => {

        _getConstruction({ 
            constructionId: constructionId,
            options: {
                constructionRelation: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
                displayName: true,
                project: true,
                contract: {
                    orderDepartments: true
                },
            },
        }) // defining mock function 

        const result = await getTargetConstruction({ constructionId: constructionId, myCompanyId: myCompanyId })  // calling actual function
        console.log(result);

        expect(mockAxios.history.post[0].url).toEqual(getConstructionUrl);
      })

      it('error test', async () => {

        mockAxios.onPost(getConstructionUrl).networkError();

        const result = await getTargetConstruction({ constructionId: constructionId, myCompanyId: myCompanyId })  // calling actual function

        expect(mockAxios.history.post[0].url).toEqual(getConstructionUrl);
        expect(result.error).toEqual('工事がありません。');
      })
})

describe('deleteTargetConstruction case', () => {
    
    it('constructionId = undefined test', async() => {
        const res = await deleteTargetConstruction({ constructionId: undefined  })
        expect(res.error).toEqual('idが足りません。')
    })

    it('success test', async() => {

        _deleteConstruction(constructionId) // defining mock function 

        const result = await deleteTargetConstruction({ constructionId: constructionId })  // calling actual function
        console.log(result);

        expect(mockAxios.history.post[0].url).toEqual(deleteConstructionUrl);
        expect(result.success).toEqual(true);
      })

      it('error test', async () => {

        mockAxios.onPost(deleteConstructionUrl).networkError();

        const result = await deleteTargetConstruction({ constructionId: constructionId })  // calling actual function

        expect(mockAxios.history.post[0].url).toEqual(deleteConstructionUrl);
        expect(result.error).toEqual('Network Error');
      })
})

