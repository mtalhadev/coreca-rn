import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import isEmpty from 'lodash/isEmpty'
import { CommonModel } from '../../models/_others/Common'
import { CompanyType, toCompanyCLType } from '../../models/company/Company'
import { MyCompanyUIType } from '../../screens/adminSide/EditMyCompany'
import { _getCompany, _updateCompany, _createCompany, _getSameNameCompanies, GetSameNameCompaniesParam, GetSameNameCompaniesResponse } from '../../services/company/CompanyService'
import { resizeImage, getRandomImageColorHue, getUuidv4, isNoValueObject } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _uploadImageAndGetUrl } from '../../services/firebase/StorageService'
import { _createDepartment } from '../../services/department/DepartmentService'
import { setActiveDepartments } from '../../stores/AccountSlice'
import { Dispatch } from 'react'
import { DepartmentType } from '../../models/department/DepartmentType'
import { changeActiveDepartments } from '../department/DepartmentCase'
import { ID } from '../../models/_others/ID'

export type WriteMyCompanyParam = {
    myCompanyId?: string
    image?: ImageInfo
    dispatch?: Dispatch<any>
    myWorkerId?: ID
} & MyCompanyUIType

export type WriteMyCompanyResponse = 'create' | 'update'

export const writeMyCompany = async (params: WriteMyCompanyParam): Promise<CustomResponse<WriteMyCompanyResponse>> => {
    try {
        const { myCompanyId, image, name, address, imageColorHue, industry, phoneNumber, departmentName, dispatch, myWorkerId } = params
        let { imageUrl, sImageUrl, xsImageUrl } = params
        if (isEmpty(name)) {
            throw {
                error: '情報が足りません。',
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
        const exist = await _getCompany({ companyId: myCompanyId })
        const newCompany: CompanyType = {
            companyId: myCompanyId,
            name,
            address,
            imageUrl,
            sImageUrl,
            xsImageUrl,
            imageColorHue,
            industry,
            phoneNumber,
        }

        if (!isNoValueObject(exist.success)) {
            const result = await _updateCompany(newCompany)
            if (result.error) {
                throw {
                    error: '会社のアップデートに失敗しました。',
                } as CustomResponse
            }
            return Promise.resolve({
                success: 'update',
            })
        } else {
            const result = await _createCompany(newCompany)
            if (result.error) {
                throw {
                    error: '会社の作成に失敗しました。',
                } as CustomResponse
            }

            const defaultDepartment: DepartmentType = {
                departmentId: getUuidv4(),
                departmentName: departmentName ?? '工事部1',
                companyId: myCompanyId,
                isDefault: departmentName == undefined ? true : false,
            }
            const departmentResult = await _createDepartment(defaultDepartment)
            if (result.error) {
                throw {
                    error: '部署の作成に失敗しました。',
                    errorCode: departmentResult.errorCode,
                } as CustomResponse
            }
            if (myWorkerId) {
                const result = await changeActiveDepartments({
                    workerId: myWorkerId,
                    departments: [defaultDepartment],
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
                if (dispatch) dispatch(setActiveDepartments([defaultDepartment]))
            }
            return Promise.resolve({
                success: 'create',
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetMyCompanyParam = {
    myCompanyId?: string
}

export type GetMyCompanyResponse = MyCompanyUIType | undefined

export const getMyCompany = async (params: GetMyCompanyParam): Promise<CustomResponse<GetMyCompanyResponse>> => {
    try {
        const { myCompanyId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        const result = await _getCompany({ companyId: myCompanyId })

        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: { ...toCompanyCLType(result.success), companyPartnership: 'my-company' } as GetMyCompanyResponse,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const getSameNameCompanies = async (params: GetSameNameCompaniesParam): Promise<CustomResponse<GetSameNameCompaniesResponse>> => {
    try {
        const { name, companyIds, isFake } = params
        if (name == undefined) {
            throw {
                error: '会社情報が足りません',
            } as CustomResponse
        }
        const result = await _getSameNameCompanies({ name, companyIds, isFake })

        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
