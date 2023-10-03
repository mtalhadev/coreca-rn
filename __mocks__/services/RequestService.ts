import { RequestModel, RequestType } from "../../src/models/request/Request"
import { __getEmulatorFunctionsURI } from "../../src/services/firebase/FunctionsService"
import { CreateRequestParam, GetRequestListByReservationIdParam, GetRequestParam, UpdateRequestParam } from "../../src/services/request/RequestService"
import mockAxios from "../mockAxios"


export const _createRequest = async (params: CreateRequestParam) => {
    
    const createRequestUrl = __getEmulatorFunctionsURI('IRequest-createRequest')

    mockAxios
    .onPost(createRequestUrl, params)
    .reply(200, {
        success: params.request.requestId
    })
}

export const _updateRequest = async (params: UpdateRequestParam) => {
    
    const updateRequestUrl = __getEmulatorFunctionsURI('IRequest-updateRequest')
    mockAxios
    .onPost(updateRequestUrl, params)
    .reply(200, {
        success: params.request.requestId
    })
}

export const _getRequest = (params: GetRequestParam) => {
    
    const getRequestUrl = __getEmulatorFunctionsURI('IRequest-getRequest')
    
    mockAxios
    .onPost(getRequestUrl, params)
    .reply(200, {
        success: {
            "requestId": params.requestId,
            "isApproval": true,
            "respondRequestId": "top",
            "companyId": "company-id",
            "requestedCompanyId": "requested-company-id",
            "isFakeCompanyRequest": true,
            "siteId": "site-id",
            "isApplication": true,
            "createdAt": 1681871154000,
            "date": 1686322800000,
            "reservationId": "reservation-id",
            "updatedAt": 1684951207000
        }
    })
}

export const _getRequestListByReservationId = (params: GetRequestListByReservationIdParam) => {
    const Url = __getEmulatorFunctionsURI('IRequest-getRequestListByReservationId')
    mockAxios
    .onPost(Url, params)
    .reply(200, {
        success: {
            "items": [
                {
                    "requestId": 'request-id',
                    "isApproval": true,
                    "respondRequestId": "top",
                    "companyId": "company-id",
                    "requestedCompanyId": "requested-company-id",
                    "isFakeCompanyRequest": true,
                    "siteId": "site-id",
                    "isApplication": true,
                    "createdAt": 1681871154000,
                    "date": 1686322800000,
                    "reservationId": "reservation-id",
                    "updatedAt": 1684951207000
                },
            ]
        },
    })

}
