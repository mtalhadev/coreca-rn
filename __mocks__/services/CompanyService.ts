import { Create, Update } from "../../src/models/_others/Common"
import { CustomResponse } from "../../src/models/_others/CustomResponse"
import { CompanyModel, CompanyType } from "../../src/models/company/Company"
import { GetCompanyParam, GetCompanyResponse, GetPartnerCompaniesOfTargetCompanyParam, GetPartnerCompaniesOfTargetCompanyResponse, getCompanyListOfTargetConstructionParam } from "../../src/services/company/CompanyService"
import { __getEmulatorFunctionsURI, _callFunctions } from "../../src/services/firebase/FunctionsService"
import mockAxios from "../mockAxios"


export const _createCompany = (company: CompanyModel) => {
    
    const createCompanyUrl = __getEmulatorFunctionsURI('ICompany-createCompany')
    const newCompany: CompanyType = {
        companyId: company.companyId,
        name: company.name,
        address: company.address,
        imageUrl: 'https://image-url',
        sImageUrl: 'https://simage-url',
        xsImageUrl: 'https://xsimage-url',
        imageColorHue: company.imageColorHue,
        industry: company.industry,
        phoneNumber: company.phoneNumber,
    }

    mockAxios
    .onPost(createCompanyUrl, company)
    .reply(200, {
        success: company.companyId
    })
}

export const _updateCompany = (company: CompanyModel) => {
    
    const updateCompanyUrl = __getEmulatorFunctionsURI('ICompany-updateCompany')
    const newCompany: CompanyType = {
        companyId: company.companyId,
        name: company.name,
        address: company.address,
        imageUrl: 'https://image-url',
        sImageUrl: 'https://simage-url',
        xsImageUrl: 'https://xsimage-url',
        imageColorHue: company.imageColorHue,
        industry: company.industry,
        phoneNumber: company.phoneNumber,
    }
    mockAxios
    .onPost(updateCompanyUrl, newCompany)
    .reply(200, {
        success: company.companyId
    })
}

export const _getCompany = (params: GetCompanyParam) => {
    
    const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')
    
    mockAxios
    .onPost(getCompanyUrl, params)
    .reply(200, {
        success: {
            "companyId": params.companyId,
            "imageColorHue": 226,
            "name": "Test",
            "isFake": true,
            "createdAt": 1680685040000,
            "updatedAt": 1684346409000,
            "displayName": "Test Company"
        }
    })
}

export const _getPartnerCompaniesOfTargetCompany = (params: GetPartnerCompaniesOfTargetCompanyParam) => {
    
    const getPartnerCompaniesUrl = __getEmulatorFunctionsURI('ICompany-getPartnerCompaniesOfTargetCompany')
    
    mockAxios
    .onPost(getPartnerCompaniesUrl, params)
    .reply(200, {
        "success": {
            "items": [
                {
                    "departmentName": "",
                    "companyId": "f35d482a-6f4b-4d1a-acca-d41b06243805",
                    "phoneNumber": "666666666",
                    "address": "木の葉の里",
                    "imageColorHue": 113,
                    "xsImageUrl": "https://firebasestorage.googleapis.com:443/v0/b/coreca-98aa2.appspot.com/o/images%2F93eb379e-35f1-4a35-8b30-2dfc7e5db3e9.jpg?alt=media&token=f2207896-e4a0-45b3-98da-4797b8e35c51",
                    "imageUrl": "https://firebasestorage.googleapis.com:443/v0/b/coreca-98aa2.appspot.com/o/images%2F5fb2ac16-3b36-419d-8aa4-f23cde122bf8.jpg?alt=media&token=2fff61ac-e02c-4bdc-b13e-faae816d9b06",
                    "name": "NARUTO",
                    "industry": "66",
                    "sImageUrl": "https://firebasestorage.googleapis.com:443/v0/b/coreca-98aa2.appspot.com/o/images%2Fc0c90744-12ee-4df2-9c7f-ff21d989c852.jpg?alt=media&token=c3199632-deb6-4172-ba62-efec7da8fa52",
                    "isFake": false,
                    "planTicketId": "8cc09f8f-4495-4cf5-b40a-b1db6924fcd2",
                    "createdAt": 1665068213000,
                    "updatedAt": 1684346409000,
                    "displayName": "NARUTO",
                    "lastDeal": {
                        "requestOrderDate": null,
                        "requestReceiveDate": null,
                        "contractOrderDate": null,
                        "contractReceiveDate": null,
                        "latestLastDealDate": null
                    }
                }
            ]
        },
        "error": null
    })
}

export const _getCompanyListOfTargetConstruction = (params: getCompanyListOfTargetConstructionParam) => {
    
    const Url = __getEmulatorFunctionsURI('ICompany-getCompanyListOfTargetConstruction')
    
    mockAxios
    .onPost(Url, params)
    .reply(200, {
        "success": {
            "companies": {
                "items": []
            }
        },
        "error": null
    })
}