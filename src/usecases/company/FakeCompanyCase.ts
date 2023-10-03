import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import isEmpty from 'lodash/isEmpty'
import { CommonModel, Create, Update, toCommonCLType } from '../../models/_others/Common'
import { CompanyCLType, CompanyType } from '../../models/company/Company'
import { FakeCompanyUIType } from '../../screens/adminSide/company/editCompany/EditFakeCompany'
import { _getCompany, _updateCompany, _createCompany, _deleteCompany } from '../../services/company/CompanyService'
import { _getPartnershipOfTargetCompanies, _createPartnership, _updatePartnership } from '../../services/partnership/PartnershipService'
import { CustomDate } from '../../models/_others/CustomDate'
import { resizeImage, getRandomImageColorHue, getUuidv4, isNoValueObject, stringFieldValue } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getMyPartnershipCompanies, GetMyPartnershipCompaniesResponse } from './CompanyListCase'
import { deleteFieldParam } from '../../services/firebase/FirestoreService'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _uploadImageAndGetUrl } from '../../services/firebase/StorageService'

export type WriteFakeCompanyParam = {
    id?: string
    myCompanyId?: string
    image?: ImageInfo
} & FakeCompanyUIType

export type WriteFakeCompanyResponse = 'update' | 'create'

export const writeFakeCompany = async (params: WriteFakeCompanyParam): Promise<CustomResponse<WriteFakeCompanyResponse>> => {
    try {
        const { id, myCompanyId, image, name, address, ownerName, ownerEmail, ownerPhoneNumber, industry, imageColorHue } = params
        let { imageUrl, sImageUrl, xsImageUrl } = params
        if (isEmpty(name)) {
            throw {
                error: '名前が足りません。',
            } as CustomResponse
        }
        if (id == undefined) {
            throw {
                error: 'idがありません。',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        if (image?.uri) {
            const resize = await resizeImage(image)
            const [mSizeResult, sSizeResult, xsSizeResult] = await Promise.all([_uploadImageAndGetUrl(resize.m?.uri), _uploadImageAndGetUrl(resize.s?.uri), _uploadImageAndGetUrl(resize.xs?.uri)])
            imageUrl = mSizeResult.success
            sImageUrl = sSizeResult.success
            xsImageUrl = xsSizeResult.success
        }
        const exist = await _getCompany({ companyId: id })
        const _partnership = await _getPartnershipOfTargetCompanies({ companyId: id, companyId2: myCompanyId })
        const isUpdate = !isNoValueObject(exist.success)

        const newCompany = {
            companyId: id,
            name,
            address: stringFieldValue({ isUpdate, value: address }),
            ownerEmail: stringFieldValue({ isUpdate, value: ownerEmail }),
            ownerName: stringFieldValue({ isUpdate, value: ownerName }),
            ownerPhoneNumber: stringFieldValue({ isUpdate, value: ownerPhoneNumber }),
            industry: stringFieldValue({ isUpdate, value: industry }),
            imageUrl,
            sImageUrl,
            xsImageUrl,
            imageColorHue,
            isFake: true,
        } as Update<CompanyType>

        let res: WriteFakeCompanyResponse = 'update'
        if (isUpdate) {
            const result = await _updateCompany(newCompany)
            if (result.error) {
                throw {
                    error: '会社のアップデートに失敗しました。',
                } as CustomResponse
            }
        } else {
            const result = await _createCompany(newCompany as Create<CompanyType>)
            if (result.error) {
                throw {
                    error: '会社の作成に失敗しました。',
                } as CustomResponse
            }
            res = 'create'
        }
        if (isNoValueObject(_partnership.success)) {
            const result = await _createPartnership({
                partnershipId: getUuidv4(),
                toCompanyId: id,
                fromCompanyId: myCompanyId,
                isAccepted: true,
            })
            if (result.error) {
                throw {
                    error: '会社関係の作成に失敗しました。',
                } as CustomResponse
            }
        }
        return Promise.resolve({
            success: res,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetFakeCompanyParam = {
    id?: string
    myCompanyId?: string
}

export type GetFakeCompanyResponse = FakeCompanyUIType | undefined

export const toFakeCompanyUIType = (company?: CompanyType): FakeCompanyUIType => {
    return {
        ...toCommonCLType(company),
        ownerEmail: company?.ownerEmail,
    } as FakeCompanyUIType
}

export const getFakeCompany = async (params: GetFakeCompanyParam): Promise<CustomResponse<GetFakeCompanyResponse>> => {
    try {
        const { id, myCompanyId } = params
        if (isEmpty(id) || id == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        const result = await _getCompany({ companyId: id, options: { companyPartnership: { params: { companyId: myCompanyId } } } })

        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: toFakeCompanyUIType(result.success) as GetFakeCompanyResponse | undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteFakeCompanyParam = {
    companyId?: string
}

export const deleteFakeCompany = async (params: DeleteFakeCompanyParam): Promise<CustomResponse> => {
    try {
        const { companyId } = params
        if (isEmpty(companyId) || companyId == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        const result = await _deleteCompany(companyId)
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetAllFakeCompaniesParam = {
    myCompanyId?: string
}

export type GetAllFakeCompaniesResponse = CompanyCLType[]

export const getAllFakeCompanies = async (params: GetAllFakeCompaniesParam): Promise<CustomResponse<GetAllFakeCompaniesResponse | undefined>> => {
    try {
        const { myCompanyId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        const result: CustomResponse<GetMyPartnershipCompaniesResponse> = await getMyPartnershipCompanies({ myCompanyId })

        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        const rtnCompanies = [] as CompanyCLType[]
        ;(result.success as CompanyCLType[]).forEach((companyUI: CompanyCLType) => {
            if (companyUI.isFake && companyUI.connectedCompanyId == undefined) {
                rtnCompanies.push(companyUI)
            }
        })

        return Promise.resolve({
            success: rtnCompanies,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type ConnectFakeCompanyParam = {
    fakeCompanyId?: string
    realCompanyId?: string
}

export const connectFakeCompany = async (params: ConnectFakeCompanyParam): Promise<CustomResponse> => {
    try {
        const { fakeCompanyId, realCompanyId } = params
        if (fakeCompanyId == undefined) {
            throw {
                error: '仮会社情報がありません。',
            } as CustomResponse
        }
        if (realCompanyId == undefined) {
            throw {
                error: '結合先の会社情報がありません。',
            } as CustomResponse
        }

        const resultRead = await _getCompany({ companyId: fakeCompanyId })
        if (resultRead.error) {
            throw {
                error: '仮会社情報の取得に失敗しました。',
            } as CustomResponse
        }

        ;(resultRead.success as CompanyType).connectedCompanyId = realCompanyId
        const resultUpdate = await _updateCompany(resultRead.success as CompanyType)
        if (resultUpdate.error) {
            throw {
                error: '仮会社との結合に失敗しました。',
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DisconnectFakeCompanyParam = {
    fakeCompanyId?: string
}

export const disconnectFakeCompany = async (params: DisconnectFakeCompanyParam): Promise<CustomResponse> => {
    try {
        const { fakeCompanyId } = params
        if (fakeCompanyId == undefined) {
            throw {
                error: '仮会社情報がありません。',
            } as CustomResponse
        }

        const resultUpdate = await _updateCompany({
            companyId: fakeCompanyId,
            connectedCompanyId: deleteFieldParam(),
        })
        if (resultUpdate.error) {
            throw {
                error: '仮会社との結合解除に失敗しました。',
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
