import mockAxios from "../../../__mocks__/mockAxios";
import { _createConstruction, _getConstruction, _updateConstruction } from "../../../__mocks__/services/ConstructionService";
import { _getInvRequestListOfTargetInvReservation } from "../../../__mocks__/services/InvRequestService";
import { _createInvReservation, _deleteInvReservation, _getInvReservation, _updateInvReservation } from "../../../__mocks__/services/InvReservationService";
import { _updateProject } from "../../../__mocks__/services/ProjectService";
import { getDailyEndTime, getDailyStartTime, newCustomDate, toCustomDateFromTotalSeconds } from "../../../src/models/_others/CustomDate";
import { InvReservationModel } from "../../../src/models/invReservation/InvReservation";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { WriteInvReservationParam,  deleteInvReservation,  getInvReservation, getInvReservationDetail, writeInvReservation } from "../../../src/usecases/invReservation/InvReservationCase";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory();
});

let params: WriteInvReservationParam = {
    invReservationId: 'inv-reservation-id',
    myCompanyId: 'my-company-id',
    startDate: toCustomDateFromTotalSeconds(1670684400000),
    endDate: toCustomDateFromTotalSeconds(1676041200000),
    initialWorkerCount: 1,
    myWorkerId: 'worker-id',
    offDaysOfWeek: [],
    otherOffDays: [],
    targetCompany: {
        companyId: "target-company-id",
        name: "Test",
        isFake: false
    },
    projectOwnerCompany: {
        companyId: "project-owner-company-id",
    },
    /**
     * 以下は仮会社へ送る場合に必要
     */
    project: {
        projectId: "project-id",
        projectName: 'Test',
        imageUrl:  "",
        sImageUrl:  "",
        xsImageUrl:  "",
        imageColorHue: 114,
    },
    construction: {
        constructionId: 'construction-id',
        contractId: 'contract-id',
        offDaysOfWeek: [],
        otherOffDays: [],
        remarks: '',
        requiredWorkerNum: 1,
        siteMeetingTime: newCustomDate(),
        siteStartTime:newCustomDate() ,
        siteStartTimeIsNextDay: false,
        siteEndTime: newCustomDate(),
        siteEndTimeIsNextDay: false,
        siteRequiredNum: 2,
        siteAddress: '',
        siteBelongings: '',
        siteRemarks: '',

    }
}
const getInvReservationUrl = __getEmulatorFunctionsURI('IInvReservation-getInvReservation')
const updateInvReservationUrl = __getEmulatorFunctionsURI('IInvReservation-updateInvReservation')
const createInvReservationUrl = __getEmulatorFunctionsURI('IInvReservation-createInvReservation')
const deleteInvReservationUrl = __getEmulatorFunctionsURI('IInvReservation-deleteInvReservation')
const getInvRequestListOfTargetInvReservationUrl = __getEmulatorFunctionsURI('IInvRequest-getInvRequestListOfTargetInvReservation')
const updateProjectUrl = __getEmulatorFunctionsURI('IProject-updateProject')
const updateConstructionUrl = __getEmulatorFunctionsURI('IConstruction-updateConstruction')

describe('writeInvReservation case', () => {
    
    it('success test', async() => {
        _getInvRequestListOfTargetInvReservation({ invReservationId: 'inv-reservation-id' })
        _updateInvReservation({
            invReservationId: 'inv-reservation-id',
            startDate: getDailyStartTime(params.startDate ?? newCustomDate())?.totalSeconds,
            endDate: getDailyEndTime(params.endDate ?? newCustomDate())?.totalSeconds,
            targetCompanyId: params.targetCompany?.companyId,
            myCompanyId: params.myCompanyId,
            extraDates: [],
            initialWorkerCount: params.initialWorkerCount,
            offDaysOfWeek: params.offDaysOfWeek,
            otherOffDays: params.otherOffDays?.map((date) => date.totalSeconds),
            projectOwnerCompanyId: params.projectOwnerCompany?.companyId,
        })
        const res = await writeInvReservation(params)
        console.log(res);
        
        expect(mockAxios.history.post.length).toEqual(2);
        expect(mockAxios.history.post[0].url).toEqual(getInvRequestListOfTargetInvReservationUrl);
        expect(mockAxios.history.post[1].url).toEqual(updateInvReservationUrl);
      })

    it('error test 1', async () => {

        mockAxios.onPost(getInvRequestListOfTargetInvReservationUrl).networkError();

        const res = await writeInvReservation(params)

        expect(mockAxios.history.post[0].url).toEqual(getInvRequestListOfTargetInvReservationUrl);
        expect(res.error).toEqual('Network Error');
      })

    it('error test 2', async () => {
        _getInvRequestListOfTargetInvReservation({ invReservationId: 'inv-reservation-id' })
        mockAxios.onPost(updateInvReservationUrl).networkError();

        const res = await writeInvReservation(params)

        expect(mockAxios.history.post[0].url).toEqual(getInvRequestListOfTargetInvReservationUrl);
        expect(mockAxios.history.post[1].url).toEqual(updateInvReservationUrl);
        expect(res.error).toEqual('Network Error');
      })

})


describe('getInvReservationDetail case', () => {
    
    it('success test', async() => {

        _getInvReservation({
            invReservationId: params.invReservationId ?? 'no-id',
            options: {
                targetCompany: {
                    lastDeal: {
                        params: {
                            myCompanyId: params.myCompanyId,
                        },
                    },
                    companyPartnership: {
                        params: {
                            companyId: params.myCompanyId,
                        },
                    },
                },
                myCompany: {
                    lastDeal: {
                        params: {
                            myCompanyId: params.myCompanyId,
                        },
                    },
                    companyPartnership: {
                        params: {
                            companyId: params.myCompanyId,
                        },
                    },
                },
                construction: {
                    project: {
                        updateWorker: {
                            company: true,
                        },
                    },
                    contract: true,
                    constructionMeter: { params: { companyId: params.myCompanyId ?? 'no-id' } },
                },
                projectOwnerCompany: true,
            },
        })

        const res = await getInvReservationDetail({ invReservationId: params.invReservationId, myCompanyId: params.myCompanyId })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getInvReservationUrl);
        expect(res.success?.invReservationId).toEqual(params.invReservationId)
      })

    it('error test', async () => {
        mockAxios.onPost(getInvReservationUrl).networkError();

        const res = await getInvReservationDetail({ invReservationId: params.invReservationId, myCompanyId: params.myCompanyId })

        expect(mockAxios.history.post[0].url).toEqual(getInvReservationUrl);
        expect(res.error).toEqual('Network Error');
      })

})

describe('deleteInvReservation case', () => {
    
    it('success test', async() => {

        _deleteInvReservation(params.invReservationId || 'no-id')

        const res = await deleteInvReservation({ invReservationId: params.invReservationId, invRequestIds: [] })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(deleteInvReservationUrl);
        expect(res.success).toEqual(true)
      })

    it('error test', async () => {
        mockAxios.onPost(deleteInvReservationUrl).networkError();

        const res = await deleteInvReservation({ invReservationId: params.invReservationId, invRequestIds: [] })

        expect(mockAxios.history.post[0].url).toEqual(deleteInvReservationUrl);
        expect(res.error).toEqual('Network Error');
      })

})

