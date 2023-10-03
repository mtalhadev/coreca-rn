import mockAxios from '../../../__mocks__/mockAxios'
import { _createConstruction, _getConstruction, _getConstructionRelationType, _updateConstruction } from '../../../__mocks__/services/ConstructionService'
import { _getSiteListOfTargetConstruction } from '../../../__mocks__/services/SiteService'
import { ConstructionModel } from '../../../src/models/construction/Construction'
import { __getEmulatorFunctionsURI } from '../../../src/services/firebase/FunctionsService'
import { WriteMyConstructionParam, getMyTotalConstruction, writeMyConstruction } from '../../../src/usecases/construction/MyConstructionCase'

afterEach(() => {
    mockAxios.reset()
    mockAxios.resetHistory()
})

let params: WriteMyConstructionParam = {
    constructionId: 'construction-id',
    updateWorkerId: 'worker-id',
    myCompanyId: 'my-company-id',
    contractId: 'contract-id',
    construction: {
        contractId: 'contract-id',
        name: 'Test',
        updateWorkerId: 'worker-id',
        constructionId: 'construction-id',
        projectId: 'project-id',
        requiredWorkerNum: 10,
    },
    project: {
        imageColorHue: 189,
        endDate: 1668153600000,
        name: 'ABC',
        createCompanyId: '',
        updateWorkerId: '',
        projectId: '',
        startDate: 1665471600000,
        isFakeCompanyManage: false,
        createdAt: 1665553113000,
        updatedAt: 1665553119000,
    },
}

const getConstructionUrl = __getEmulatorFunctionsURI('IConstruction-getConstruction')
const getConstructionRelationTypeUrl = __getEmulatorFunctionsURI('IConstruction-getConstructionRelationType')
const updateConstructionUrl = __getEmulatorFunctionsURI('IConstruction-updateConstruction')
const createConstructionUrl = __getEmulatorFunctionsURI('IConstruction-createConstruction')
const getSiteListOfTargetConstructionUrl = __getEmulatorFunctionsURI('ISite-getSiteListOfTargetConstruction')

describe('writeMyConstruction case', () => {
    it('constructionId = undefined test', async () => {
        const res = await writeMyConstruction({ ...params, constructionId: undefined })
        expect(res.error).toEqual('idがありません。')
    })

    it('myCompanyId = undefined test', async () => {
        const res = await writeMyConstruction({ ...params, myCompanyId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('success test', async () => {
        _getConstruction({ constructionId: params.constructionId || 'no-id' })
        _getConstructionRelationType({ constructionId: params.constructionId || 'no-id', companyId: params.myCompanyId || 'no-id' })
        _getSiteListOfTargetConstruction({ constructionId: params.constructionId || 'no-id' })
        _createConstruction({ ...params } as ConstructionModel)
        _updateConstruction({ ...params } as ConstructionModel)

        const res = await writeMyConstruction(params)

        expect(mockAxios.history.post.length).toEqual(4)
        expect(mockAxios.history.post[0].url).toEqual(getSiteListOfTargetConstructionUrl)
        expect(mockAxios.history.post[1].url).toEqual(getConstructionUrl)
        expect(mockAxios.history.post[2].url).toEqual(getConstructionRelationTypeUrl)
        expect(mockAxios.history.post[3].url).toEqual(updateConstructionUrl)
    })

    it('error test 1', async () => {
        mockAxios.onPost(getSiteListOfTargetConstructionUrl).networkError()

        const res = await writeMyConstruction(params)

        expect(mockAxios.history.post[0].url).toEqual(getSiteListOfTargetConstructionUrl)
        expect(res.error).toEqual('Network Error')
    })

    it('error test 2', async () => {
        _getSiteListOfTargetConstruction({ constructionId: params.constructionId || 'no-id' })
        _createConstruction({ ...params } as ConstructionModel)

        mockAxios.onPost(getConstructionUrl).networkError()

        const res = await writeMyConstruction(params)

        expect(mockAxios.history.post[0].url).toEqual(getSiteListOfTargetConstructionUrl)
        expect(mockAxios.history.post[1].url).toEqual(getConstructionUrl)
        expect(mockAxios.history.post[2].url).toEqual(createConstructionUrl)
        // expect(res.error).toEqual('会社のアップデートに失敗しました。');
    })
})

describe('getMyTotalConstruction case', () => {
    it('id = undefined test', async () => {
        const res = await getMyTotalConstruction({ id: undefined })
        expect(res.error).toEqual('idが足りません。')
    })

    it('success test', async () => {
        _getConstruction({
            constructionId: params.constructionId || 'no-id',
            options: { contract: { orderDepartments: true } },
        })

        const res = await getMyTotalConstruction({ id: params.constructionId || 'no-id' })
        console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(getConstructionUrl)
    })

    it('error test', async () => {
        const getConstructionUrl = __getEmulatorFunctionsURI('IConstruction-getConstruction')

        mockAxios.onPost(getConstructionUrl).networkError()

        const res = await getMyTotalConstruction({ id: params.constructionId })

        expect(mockAxios.history.post[0].url).toEqual(getConstructionUrl)
        expect(res.error).toEqual('工事がありません。')
    })
})
