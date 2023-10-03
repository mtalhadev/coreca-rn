import { ReservationModel, ReservationType } from "../../src/models/reservation/Reservation"
import { __getEmulatorFunctionsURI } from "../../src/services/firebase/FunctionsService"
import {  GetReservationOfTargetConstructionAndCompaniesParam, GetReservationParam } from "../../src/services/reservation/ReservationService"
import mockAxios from "../mockAxios"


export const _createReservation = async (reservation: ReservationModel) => {
    
    const createReservationUrl = __getEmulatorFunctionsURI('IReservation-createReservation')

    mockAxios
    .onPost(createReservationUrl, reservation)
    .reply(200, {
        success: reservation.reservationId
    })
}

export const _updateReservation = async (reservation: ReservationModel) => {
    
    const updateReservationUrl = __getEmulatorFunctionsURI('IReservation-updateReservation')
    mockAxios
    .onPost(updateReservationUrl, reservation)
    .reply(200, {
        success: reservation.reservationId
    })
}

export const _getReservation = (params: GetReservationParam) => {
    
    const getReservationUrl = __getEmulatorFunctionsURI('IReservation-getReservation')
    
    mockAxios
    .onPost(getReservationUrl, params)
    .reply(200, {
        success: {
            "reservationId": params.reservationId,
            "targetCompanyId": "target-company-id",
            "constructionId": "construction-id",
            "myCompanyId": "my-company-id",
            "createdAt": 1682920158000,
            "isInfinity": true,
            "updatedAt": 1682964011000
        }
    })
}

export const _deleteReservation = (reservationId: string) => {
    
    const Url = __getEmulatorFunctionsURI('IReservation-deleteReservation')
    
    mockAxios
    .onPost(Url, reservationId)
    .reply(200, {
        success: true
    })
}

export const _getReservationOfTargetConstructionAndCompanies = async (params: GetReservationOfTargetConstructionAndCompaniesParam) => {
    
    const Url = __getEmulatorFunctionsURI('IReservation-getReservationOfTargetConstructionAndCompanies')
    
    mockAxios
    .onPost(Url, params)
    .reply(200, {
        "success": {
            "items": [
                {
                    "reservationDate": 1668067200000,
                    "endDate": 1668128455000,
                    "meetingDate": 1668094255000,
                    "reservationId": "reservation-id",
                    "isConfirmed": false,
                    "constructionId": "construction-id",
                    "startDate": 1668096055000,
                    "createdAt": 1668062519000,
                    "relatedCompanyIds": [
                        "related-company-id1",
                        "related-company-id2"
                    ],
                    "updatedAt": 1684864814000
                },
            ]
        },
        "error": null
    })
}