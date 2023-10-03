import { CommonModel, Create, Update } from '../_others/Common'
import { ID } from './ID'
/**
 *  - password - アプリを開くためのパスワード
 */
export type AppPasswordModel = Partial<{
    appPasswordId: ID
    password: string
}> &
    CommonModel

export const initAppPassword = (appPassword: Create<AppPasswordModel> | Update<AppPasswordModel>): Update<AppPasswordModel> => {
    const newAppPassword: Update<AppPasswordModel> = {
        appPasswordId: appPassword.appPasswordId,
        password: appPassword.password,
    }
    return newAppPassword
}

export type AppPasswordType = AppPasswordModel