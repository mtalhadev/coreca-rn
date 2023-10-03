import mockAxios from "../../../__mocks__/mockAxios";
import { _getRequestListByReservationId } from "../../../__mocks__/services/RequestService";
import { _createReservation, _deleteReservation, _getReservationOfTargetConstructionAndCompanies } from "../../../__mocks__/services/ReservationService";
import { newCustomDate } from "../../../src/models/_others/CustomDate";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { _getReservationListByIds } from "../../../src/services/reservation/ReservationService";
import { AddReservationsParam, UpdateReservationParam, addReservations, deleteReservation, getReservationListByIds, updateReservation } from "../../../src/usecases/reservation/ReservationCase";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory();
});

const getReservationOfTargetConstructionAndCompaniesUrl = __getEmulatorFunctionsURI('IReservation-getReservationOfTargetConstructionAndCompanies')
const createReservationUrl = __getEmulatorFunctionsURI('IReservation-createReservation')
const getRequestListByReservationIdUrl = __getEmulatorFunctionsURI('IRequest-getRequestListByReservationId')
const deleteReservationUrl = __getEmulatorFunctionsURI('IReservation-deleteReservation')

let params: AddReservationsParam = {
    myCompanyId: 'my-company-id',
    requestedCompanyId: 'requested-company-id',
    constructionIds: ['construction-id'],
    /**
     * 外部指定用
     */
    newReservationId: 'new-reservation-id'
}
describe('addReservations case', () => {
    
    it('myCompanyId = undefined test', async() => {
        const res = await addReservations({ ...params, myCompanyId: undefined })
        expect(res.error).toEqual(`自社情報がありません。ログインし直してください。`)
    })

    it('requestedCompanyId = undefined test', async() => {
        const res = await addReservations({ ...params, requestedCompanyId: undefined })
        expect(res.error).toEqual(`常用する会社を選択してください。`)
    })

    it('constructionIds = undefined test', async() => {
        const res = await addReservations({ ...params, constructionIds: undefined })
        expect(res.error).toEqual(`工事情報が足りません。`)
    })

    it('success test', async() => {

        _getReservationOfTargetConstructionAndCompanies({
            targetCompanyId: params.requestedCompanyId || 'no-id',
            myCompanyId: params.myCompanyId || 'no-id',
            constructionId: 'construction-id',
        })
        _createReservation({
            reservationId: params.newReservationId,
            targetCompanyId: params.requestedCompanyId,
            myCompanyId: params.myCompanyId,
            constructionId: 'construction-id'
        })

        const res = await addReservations({ ...params })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getReservationOfTargetConstructionAndCompaniesUrl);
        expect(mockAxios.history.post[1].url).toEqual(createReservationUrl);
        expect(res.success).toEqual([params.newReservationId])
      })

    it('error test', async () => {
        _getReservationOfTargetConstructionAndCompanies({
            targetCompanyId: params.requestedCompanyId || 'no-id',
            myCompanyId: params.myCompanyId || 'no-id',
            constructionId: 'construction-id',
        })
        mockAxios.onPost(createReservationUrl).networkError();

        const res = await addReservations({ ...params })

        expect(mockAxios.history.post[0].url).toEqual(getReservationOfTargetConstructionAndCompaniesUrl);
        expect(mockAxios.history.post[1].url).toEqual(createReservationUrl);
        expect(res.error).toEqual('Network Error');
      })

})

let updateParms: UpdateReservationParam = {
    myCompanyId: 'my-company-id',
    requestedCompanyId: 'requested-company-id',
    date: newCustomDate(),
    deleteNum: 1
}

describe('updateReservation case', () => {
    
    it('myCompanyId = undefined test', async() => {
        const res = await updateReservation({ ...updateParms, myCompanyId: undefined })
        expect(res.error).toEqual(`自社情報がありません。ログインし直してください。`)
    })

    it('requestedCompanyId = undefined test', async() => {
        const res = await updateReservation({ ...updateParms, requestedCompanyId: undefined })
        expect(res.error).toEqual(`常用する会社を選択してください。`)
    })

    it('deleteNum = undefined test', async() => {
        const res = await updateReservation({ ...updateParms, deleteNum: undefined })
        expect(res.error).toEqual(`情報が足りません。`)
    })

    it('success test', async() => {

        const res = await updateReservation({ ...updateParms })
        console.log(res);
        
        expect(res.success).toEqual(true)
      })
})

describe('deleteReservation case', () => {
    
    it('reservationId = undefined test', async() => {
        const res = await deleteReservation({ reservationId: undefined })
        expect(res.error).toEqual(`常用予約IDがありません`)
    })

    it('success test', async() => {

        mockAxios
        .onPost(getRequestListByReservationIdUrl, { reservationId: 'reservation-id' })
        .reply(200, {
            success: {
                "items": []
            },
        })
        _deleteReservation('reservation-id')

        const res = await deleteReservation({ reservationId: 'reservation-id' })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getRequestListByReservationIdUrl);
        expect(mockAxios.history.post[1].url).toEqual(deleteReservationUrl);
        expect(res.success).toEqual(true)
      })

    it('error test', async () => {
        _getRequestListByReservationId({
            reservationId: 'reservation-id'
        })
        _deleteReservation('reservation-id')

        const res = await deleteReservation({ reservationId: 'reservation-id' })

        expect(mockAxios.history.post[0].url).toEqual(getRequestListByReservationIdUrl);
        expect(res.error).toEqual('既にこの工事で常用依頼がされています');
      })

})

