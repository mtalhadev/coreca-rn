import { CustomResponse } from '../../src/models/_others/CustomResponse'
import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { GetDateDataListBySpanParam, GetDateDataListBySpanResponse, GetDateDataParam, GetDateDataResponse, _getDateData, _getDateDataListBySpan } from '../../src/services/date/DateDataService'
import { toCustomDateFromString } from '../../src/utils/ext/Date.extensions'
import { initTestApp } from '../utils/testUtils'

beforeEach(async()=> {
    initTestApp()
})



describe('DateDataService', () => {
    // it('_getDateData test', async() => {
    //  const params:GetDateDataParam = {
    //         date: toCustomDateFromString('2022/04/22'),
    //         endDate: toCustomDateFromString('2022/04/23'),
    //         options: {
    //             sites: {
    //                 params: {
    //                     companyId: '9d47edba-7287-4435-a8f7-c30071bf8765',
    //                     types: ['all'],
    //                 },
    //                 siteNameData: true,
    //             },
    //         },
    //     }
    //     const rtn: CustomResponse<GetDateDataResponse> = await _getDateData(params)
    //     expect(rtn.success?.sites?.managerSites?.items).toBe([])
    // })



    // it('getNotificationList worker test', async() => {
    //     const params:GetDateDataListBySpanParam = {
    //         startDate: toCustomDateFromString('2022/05/01'),
    //         endDate: toCustomDateFromString('2022/05/03'),
    //         options: {
    //             sites: {
    //                 params: {
    //                     companyId: '9d47edba-7287-4435-a8f7-c30071bf8765',
    //                     types: ['all'],
    //                 },
    //                 siteNameData: true,
    //             },
    //         },
    //     }
    //     const rtn: CustomResponse<GetDateDataListBySpanResponse> = await _getDateDataListBySpan(params)
    //     expect(rtn.success).toBe([])
    // })
})
