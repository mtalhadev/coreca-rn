import React, { useCallback } from 'react'
import { View, ViewStyle } from 'react-native'
import MenuSvg from './../../../assets/images/menu.svg'
import BackSvg from './../../../assets/images/back.svg'
import CloseSvg from './../../../assets/images/close.svg'
import HomeSvg from './../../../assets/images/home.svg'
import BellSvg from './../../../assets/images/bell.svg'
import InvoiceSvg from './../../../assets/images/invoice.svg'
import ConstructionSvg from './../../../assets/images/construction.svg'
import CompanySvg from './../../../assets/images/company.svg'
import MypageSvg from './../../../assets/images/mypage.svg'
import RichWorkerSvg from './../../../assets/images/richWorker.svg'
import RichCompanySvg from './../../../assets/images/richCompany.svg'
import ToggleSvg from './../../../assets/images/toggle.svg'
import WorkerSvg from './../../../assets/images/worker.svg'
import SiteSvg from './../../../assets/images/site.svg'
import TriangleSvg from './../../../assets/images/triangle.svg'
import AlertSvg from './../../../assets/images/alert.svg'
import PlusSvg from './../../../assets/images/plus.svg'
import AttendWorkerSvg from './../../../assets/images/attendWorker.svg'
import TimerSvg from './../../../assets/images/timer.svg'
import EditSvg from './../../../assets/images/edit.svg'
import EmailSvg from './../../../assets/images/email.svg'
import PhoneSvg from './../../../assets/images/phone.svg'
import TrophySvg from './../../../assets/images/trophy.svg'
import FilterSvg from './../../../assets/images/filter.svg'
import ReloadSvg from './../../../assets/images/reload.svg'
import MinusSvg from './../../../assets/images/minus.svg'
import ProjectSvg from './../../../assets/images/project.svg'
import TransactionSvg from './../../../assets/images/transaction.svg'
import SearchSvg from './../../../assets/images/search.svg'
import ScheduleSvg from './../../../assets/images/schedule.svg'
import UpdateSvg from './../../../assets/images/update.svg'
import AddMember from './../../../assets/images/add-member.svg'
import Admin from './../../../assets/images/admin.svg'
import AttachmentSvg from './../../../assets/images/attachment.svg'
import CloseReplySvg from './../../../assets/images/closeReply.svg'
import SendSvg from './../../../assets/images/send.svg'
import CopySvg from './../../../assets/images/copy.svg'
import ReplySvg from './../../../assets/images/reply.svg'
import ThreadSvg from './../../../assets/images/thread.svg'
import EmojiSvg from './../../../assets/images/emoji-add.svg'
import CommentSvg from './../../../assets/images/comment.svg'
import TransferSvg from './../../../assets/images/transfer.svg'
import TransferReceiveSvg from './../../../assets/images/transferReceive.svg'
import ArrowBackground from './../../../assets/images/arrowBackground.svg'
import ArrowRight from './../../../assets/images/arrowRight.svg'
import ChatMembers from './../../../assets/images/chat_members.svg'
import AddTodo from './../../../assets/images/addTodo.svg'

export type IconName =
    | 'mypage'
    | 'close'
    | 'bell'
    | 'back'
    | 'invoice'
    | 'menu'
    | 'construction'
    | 'company'
    | 'home'
    | 'rich-worker'
    | 'rich-company'
    | 'toggle'
    | 'worker'
    | 'site'
    | 'triangle'
    | 'alert'
    | 'plus'
    | 'attend-worker'
    | 'timer'
    | 'edit'
    | 'email'
    | 'phone'
    | 'trophy'
    | 'filter'
    | 'reload'
    | 'minus'
    | 'project'
    | 'transaction'
    | 'search'
    | 'schedule'
    | 'update'
    | 'add-member'
    | 'admin'
    | 'attachment'
    | 'close-reply'
    | 'send'
    | 'copy'
    | 'reply'
    | 'thread'
    | 'emoji'
    | 'comment'
    | 'transfer'
    | 'transferReceive'
    | 'arrowBackground'
    | 'arrowRight'
    | 'settings'
    | 'chatMembers'
    | 'addTodo'


export type IconPropsType = {
    name: IconName
    width: number
    height: number
    fill: string
    style?: ViewStyle
}

export const Icon = React.memo((props: Partial<IconPropsType>) => {
    let { name, width, height, fill, style } = props
    name = name ?? 'home'
    width = width ?? 25
    height = height ?? 25
    fill = fill ?? '#000'

    const iconImage = useCallback(() => {
        switch (name) {
            case 'mypage':
                return <MypageSvg width={width} height={height} fill={fill} />
            case 'close':
                return <CloseSvg width={width} height={height} fill={fill} />
            case 'bell':
                return <BellSvg width={width} height={height} fill={fill} />
            case 'back':
                return <BackSvg width={width} height={height} fill={fill} />
            case 'invoice':
                return <InvoiceSvg width={width} height={height} fill={fill} />
            case 'menu':
                return <MenuSvg width={width} height={height} fill={fill} />
            case 'construction':
                return <ConstructionSvg width={width} height={height} fill={fill} />
            case 'company':
                return <CompanySvg width={width} height={height} fill={fill} />
            case 'home':
                return <HomeSvg width={width} height={height} fill={fill} />
            case 'worker':
                return <WorkerSvg width={width} height={height} fill={fill} />
            case 'site':
                return <SiteSvg width={width} height={height} fill={fill} />
            case 'rich-worker':
                return <RichWorkerSvg width={width} height={height} />
            case 'rich-company':
                return <RichCompanySvg width={width} height={height} />
            case 'toggle':
                return <ToggleSvg width={width} height={height} fill={fill} />
            case 'triangle':
                return <TriangleSvg width={width} height={height} fill={fill} />
            case 'alert':
                return <AlertSvg width={width} height={height} fill={fill} />
            case 'plus':
                return <PlusSvg width={width} height={height} fill={fill} />
            case 'attend-worker':
                return <AttendWorkerSvg width={width} height={height} fill={fill} />
            case 'timer':
                return <TimerSvg width={width} height={height} fill={fill} />
            case 'edit':
                return <EditSvg width={width} height={height} fill={fill} />
            case 'email':
                return <EmailSvg width={width} height={height} fill={fill} />
            case 'phone':
                return <PhoneSvg width={width} height={height} fill={fill} />
            case 'trophy':
                return <TrophySvg width={width} height={height} fill={fill} />
            case 'filter':
                return <FilterSvg width={width} height={height} fill={fill} />
            case 'reload':
                return <ReloadSvg width={width} height={height} fill={fill} />
            case 'minus':
                return <MinusSvg width={width} height={height} fill={fill} />
            case 'project':
                return <ProjectSvg width={width} height={height} fill={fill} />
            case 'transaction':
                return <TransactionSvg width={width} height={height} fill={fill} />
            case 'search':
                return <SearchSvg width={width} height={height} fill={fill} />
            case 'schedule':
                return <ScheduleSvg width={width} height={height} fill={fill} />
            case 'update':
                return <UpdateSvg width={width} height={height} fill={fill} />
            case 'add-member':
                return <AddMember width={width} height={height} fill={fill} />
            case 'admin':
                return <Admin width={width} height={height} fill={fill} />
            case 'attachment':
                return <AttachmentSvg width={width} height={height} fill={fill} />
            case 'close-reply':
                return <CloseReplySvg width={width} height={height} fill={fill} />
            case 'send':
                return <SendSvg width={width} height={height} fill={fill} />
            case 'copy':
                return <CopySvg width={width} height={height} fill={fill} />
            case 'reply':
                return <ReplySvg width={width} height={height} fill={fill} />
            case 'thread':
                return <ThreadSvg width={width} height={height} fill={fill} />
            case 'comment':
                return <CommentSvg width={width} height={height} fill={fill} />
            case 'emoji':
                return <EmojiSvg width={width} height={height} fill={fill} />
            case 'transfer':
                return <TransferSvg width={width} height={height} fill={fill} />
            case 'transferReceive':
                return <TransferReceiveSvg width={width} height={height} fill={fill} />
            case 'arrowBackground':
                return <ArrowBackground width={width} height={height} fill={fill} />
            case 'arrowRight':
                return <ArrowRight width={width} height={height} fill={fill} />
            case 'settings':
                return <ArrowRight width={width} height={height} fill={fill} />
            case 'chatMembers':
                return <ChatMembers width={width} height={height} fill={fill} />
            case 'addTodo':
                return <AddTodo width={width} height={height} fill={fill} />
            default:
                return <View></View>
        }
    }, [name, width, height, fill])

    return <View style={{ ...style }}>{iconImage()}</View>
})
