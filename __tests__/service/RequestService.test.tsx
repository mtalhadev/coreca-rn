import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { _createRequest, _deleteRequest, _getRequestListOfTargetCompanies, _GetRequestListOfTargetCompaniesParam, _getRequestListOfTargetCompany, GetRequestListOfTargetCompanyParam } from '../../src/services/request/RequestService'
import { initTestApp } from '../utils/testUtils'
let requestIdArray: string[] = []
beforeAll(() => {
    initTestApp()
})
beforeEach(async()=> {

    let rtn = await _createRequest({
        request: {
            companyId: 'dummy-id-123',
            requestedCompanyId: '123-id-dummy',
            siteId: 'dummy-site-id',
        }
    })
    requestIdArray.push(rtn.success as string)
    rtn = await _createRequest({
        request:{
            companyId: '123-id-dummy',
            requestedCompanyId: 'dummy-id-123',
            siteId: 'dummy-site-id2'
        }
    })
    requestIdArray.push(rtn.success as string)

    rtn = await _createRequest({
        request:{
            companyId: '123-id-dummy',
            requestedCompanyId: 'dummy-id-456',
            siteId: 'dummy-site-id3'
        }
    })
    requestIdArray.push(rtn.success as string)
    rtn = await _createRequest({
        request:{
            companyId: '456-id-dummy',
            requestedCompanyId: '123-id-dummy',
            siteId: 'dummy-site-id4'
        }
    })
    requestIdArray.push(rtn.success as string)
})


afterEach(() => {
    requestIdArray.forEach(async(id) => {
        await _deleteRequest({requestId: id})
    })
    requestIdArray = []

})

describe('RequestService', () => {

    it('_getRequestListOfTargetCompanies order test', async() => {
        const params:_GetRequestListOfTargetCompaniesParam = {
            companyId: '123-id-dummy',
            targetCompanyId: 'dummy-id-123',
            types: ['order']
        }
        const rtn = await _getRequestListOfTargetCompanies(params)

        expect(rtn.success?.orderRequests?.items).toStrictEqual([
            expect.objectContaining({
                companyId: '123-id-dummy',
                requestedCompanyId: 'dummy-id-123',
                siteId: 'dummy-site-id2',
            })
        ])
    })
    it('_getRequestListOfTargetCompanies receive test', async() => {
        const params: _GetRequestListOfTargetCompaniesParam = {
            companyId: '123-id-dummy',
            targetCompanyId: 'dummy-id-123',
            types: ['receive']
        }
        const rtn = await _getRequestListOfTargetCompanies(params)
        expect(rtn.success?.receiveRequests?.items).toStrictEqual([
            expect.objectContaining({
                companyId: 'dummy-id-123',
                requestedCompanyId: '123-id-dummy',
                siteId: 'dummy-site-id',
            })
        ])
    })
    it('_getRequestListOfTargetCompanies all test', async() => {
        const params: _GetRequestListOfTargetCompaniesParam = {
            companyId: '123-id-dummy',
            targetCompanyId: 'dummy-id-123',
            types: ['all']
        }
        const rtn = await _getRequestListOfTargetCompanies(params)

        expect(rtn.success?.totalRequests?.items).toStrictEqual([
            expect.objectContaining({
                companyId: '123-id-dummy',
                requestedCompanyId: 'dummy-id-123',
                siteId: 'dummy-site-id2',
            }),
            expect.objectContaining({
                companyId: 'dummy-id-123',
                requestedCompanyId: '123-id-dummy',
                siteId: 'dummy-site-id',
            })])
    })


    it('_getRequestListOfTargetCompany order test', async() => {
        const params:GetRequestListOfTargetCompanyParam = {
            companyId: '123-id-dummy',
            types: ['order']
        }
        const rtn = await _getRequestListOfTargetCompany(params)

        expect(rtn.success?.orderRequests?.items).toEqual([
            expect.objectContaining({
                companyId: '123-id-dummy',
                requestedCompanyId: 'dummy-id-456',
                siteId: 'dummy-site-id3'
            }),
            expect.objectContaining({
                companyId: '123-id-dummy',
                requestedCompanyId: 'dummy-id-123',
                siteId: 'dummy-site-id2',
            })
        ])
    })
    it('_getRequestListOfTargetCompany receive test', async() => {
        const params: GetRequestListOfTargetCompanyParam = {
            companyId: '123-id-dummy',
            types: ['receive']
        }
        const rtn = await _getRequestListOfTargetCompany(params)
        expect(rtn.success?.receiveRequests?.items).toEqual([
            expect.objectContaining({
                companyId: '456-id-dummy',
                requestedCompanyId: '123-id-dummy',
                siteId: 'dummy-site-id4'
            }),
            expect.objectContaining({
                companyId: 'dummy-id-123',
                requestedCompanyId: '123-id-dummy',
                siteId: 'dummy-site-id',
            }),
        ])
    })
    it('_getRequestListOfTargetCompany all test', async() => {
        const params: GetRequestListOfTargetCompanyParam = {
            companyId: '123-id-dummy',
            types: ['all']
        }
        const rtn = await _getRequestListOfTargetCompany(params)

        expect(rtn.success?.totalRequests?.items).toEqual([
            expect.objectContaining({
                companyId: '123-id-dummy',
                requestedCompanyId: 'dummy-id-123',
                siteId: 'dummy-site-id2',
            }),
            expect.objectContaining({
                companyId: '123-id-dummy',
                requestedCompanyId: 'dummy-id-456',
                siteId: 'dummy-site-id3'
            }),
            expect.objectContaining({
                companyId: 'dummy-id-123',
                requestedCompanyId: '123-id-dummy',
                siteId: 'dummy-site-id',
            }),
            expect.objectContaining({
                companyId: '456-id-dummy',
                requestedCompanyId: '123-id-dummy',
                siteId: 'dummy-site-id4'
            })
        ])
    })
})
