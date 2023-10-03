import { CommonModel, Create, Update } from '../_others/Common'
import { ID } from '../_others/ID'
import { TotalSeconds } from '../_others/TotalSeconds'

/**
 * @param lastLoggedInAt ユーザーが最後にログインした時刻。ログイン時および（閉じていた）アプリを開いた時点で更新。
 */
export type UserInfoModel = Partial<{
    userInfoId: ID // workerIdと同じ
    lastLoggedInAt: TotalSeconds
}> &
    CommonModel

export const initUserInfo = (account: Create<UserInfoModel> | Update<UserInfoModel>): Update<UserInfoModel> => {
    const newUserInfo: Update<UserInfoModel> = {
        userInfoId: account.userInfoId,
        lastLoggedInAt: account.lastLoggedInAt,
    }
    return newUserInfo
}

export type UserInfoType = UserInfoModel & UserInfoOptionParam

/**
 * {@link UserInfoOptionParam - 説明}
 */
export type UserInfoOptionParam = {}
