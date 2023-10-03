import { _createNotification, _deleteNotification, _getNotification, _getNotificationListOfTargetAccount, _updateNotification} from '../../src/services/notification/NotificationService'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { NotificationType } from '../../src/models/notification/Notification'
import { NotificationListType } from '../../src/models/notification/NotificationListType'
import { initTestApp } from '../utils/testUtils'

let notificationIdArray: string[] = []
beforeAll(() => {
    initTestApp()
})
beforeEach(async()=> {
    let rtn: CustomResponse<string> = await _createNotification({
        notificationId: '1234-abcd-aaffff',
        title: 'お知らせ、その１',
        side: 'admin'
    })
    notificationIdArray.push(rtn.success as string)

    rtn = await _createNotification({
        notificationId: '1234-efgh-aaffff',
        title: 'お知らせ、その２',
        accountId: 'dummy-account',
        side: 'admin'
    })
    notificationIdArray.push(rtn.success as string)

    rtn = await _createNotification({
        notificationId: '1234-ijkl-aaffff',
        title: 'お知らせ、その３',
        accountId: 'dummy-account',
        side: 'admin'
    })
    notificationIdArray.push(rtn.success as string)

    rtn = await _createNotification({
        notificationId: '1234-ijkl-bbccc',
        title: 'お知らせ、その4',
        accountId: 'dummy-account',
        side: 'worker'
    })
    notificationIdArray.push(rtn.success as string)
})


afterEach(() => {
    notificationIdArray.forEach(async(id) => {
        await _deleteNotification(id)
    })
    notificationIdArray = []
})

describe('NotificationService', () => {


    it('Insert test', async() => {
        const rtn: CustomResponse<string> = await _createNotification({notificationId: 'insert-id', title: 'お知らせ、その5', side: 'admin'})
        notificationIdArray.push(rtn.success as string)
        expect(rtn.success).not.toBe(undefined)
        const rtn2: CustomResponse<string> = await _createNotification({notificationId: 'insert-id', title: 'お知らせ、その6', side: 'worker'})
        notificationIdArray.push(rtn2.success as string)
        expect(rtn2.success).not.toBe(undefined)
    })

    it('Read test exist', async() => {
        const rtn: CustomResponse<NotificationType | undefined> = await _getNotification({notificationId: notificationIdArray[0]})
        expect(rtn.success?.notificationId).toBe('1234-abcd-aaffff')
    })

    it('Read test not exist', async() => {
        const rtn: CustomResponse<NotificationType | undefined> = await _getNotification({notificationId: '1234-wxyz-aaffff'})
        expect(rtn.success?.notificationId).toBe(undefined)
    })

    it('Update test', async() => {
        let rtn: CustomResponse<NotificationType | undefined> = await _getNotification({notificationId: notificationIdArray[0]})
        const notification: NotificationType = rtn.success as NotificationType
        notification.title = 'お知らせ、その１update'

        await _updateNotification(notification)
        rtn = await _getNotification({notificationId: notificationIdArray[0]})
        expect(rtn.success?.title).toBe('お知らせ、その１update')
    })

    it('Update test not exist', async() => {
        const rtn: CustomResponse<NotificationType | undefined> = await _getNotification({notificationId: notificationIdArray[0]})
        const notification: NotificationType = rtn.success as NotificationType
        notification.notificationId = '2345-wxyz-aaffff'
        const rtn2: CustomResponse = await _updateNotification(notification)
        expect(rtn2.success).toBe(false)
    })

    it('Delete test exist', async() => {
        const rtn2: CustomResponse = await _deleteNotification(notificationIdArray[0])
        expect(rtn2.success).toBe(true)
    })

    it('getNotificationList admin test', async() => {
        const rtn: CustomResponse<NotificationListType | undefined> = await _getNotificationListOfTargetAccount({accountId: 'dummy-account', side: 'admin'})
        const notifications: NotificationType[] = rtn.success?.items as NotificationType[]
        expect(notifications[0].title).toBe('お知らせ、その２')
        expect(notifications[1].title).toBe('お知らせ、その３')
    })

    it('getNotificationList worker test', async() => {
        const rtn: CustomResponse<NotificationListType | undefined> = await _getNotificationListOfTargetAccount({accountId: 'dummy-account', side: 'worker'})
        const notifications: NotificationType[] = rtn.success?.items as NotificationType[]
        expect(notifications[0].title).toBe('お知らせ、その4')
    })
})
