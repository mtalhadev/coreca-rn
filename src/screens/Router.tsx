/* eslint-disable react/display-name */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Keyboard, Platform, AppState } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { useTextTranslation } from './../fooks/useTextTranslation'
import { CardStyleInterpolators, createStackNavigator, StackNavigationOptions } from '@react-navigation/stack'
import { useSelector, useDispatch } from 'react-redux'
import { setBackTitle, setRouteName, setUrlScheme, URLScheme, setLinkingAddListenerCount } from './../stores/NavigationSlice'
import { setHolidays, setKeyboardOpen, setLoading, setLoadingString, setToastMessage, ToastMessage } from './../stores/UtilSlice'
import { StoreType } from '../stores/Store'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'

// 管理サイド(AdminSide)
import SelectAccount from './adminSide/SelectAccount'
import SelectDepartment from './adminSide/SelectDepartment'
import SignInAccount from './adminSide/SignInAccount'
import SignUpAccount from './adminSide/SignUpAccount'
import AddInviteURL from './adminSide/AddInvitedURL'
import Launch from './adminSide/Launch'
import CreateMyCompany from './adminSide/CreateMyCompany'
import CreateOwnerWorker from './adminSide/CreateOwnerWorker'
import ResetPassword from './adminSide/ResetPassword'
import MySchedule from './adminSide/MySchedule'
import AttendanceDetail from './adminSide/attendance/AttendanceDetail'
import PartnerCompanyList from './adminSide/company/PartnerCompanyList'
import SelectCompany from './adminSide/company/SelectCompany'
import DepartmentManage from './adminSide/department/DepartmentManage'
import CreateDepartment from './adminSide/department/CreateDepartment'
import EditDepartment from './adminSide/department/EditDepartment'
import CreateFakeCompany from './adminSide/company/addCompany/CreateFakeCompany'
import InviteCompany from './adminSide/company/addCompany/InviteCompany'
import SelectCompanyCreateWay from './adminSide/company/addCompany/SelectCompanyCreateWay'
import CompanyDetail from './adminSide/company/companyDetail/CompanyDetail'
import CompanyDetailRouter from './adminSide/company/companyDetail/CompanyDetailRouter'
import CompanyInvoice from './adminSide/company/companyDetail/CompanyInvoice'
import EditFakeCompany from './adminSide/company/editCompany/EditFakeCompany'
import EditMyCompany from './adminSide/EditMyCompany'
import DateArrangements from './adminSide/date/DateArrangements'
import DateRouter from './adminSide/date/DateRouter'
import AdminHome from './adminSide/home/AdminHome'
import SelectSiteCreateOption from './adminSide/site/addSite/SelectSiteCreateOption'
import AdminMyPageRouter from './adminSide/mypage/AdminMyPageRouter'
import AdminSettings from './adminSide/mypage/AdminSettings'
import MyCompanyDetail from './adminSide/mypage/MyCompanyDetail'
import MyCompanyWorkerList from './adminSide/mypage/MyCompanyWorkerList'
import AdminNotification from './adminSide/AdminNotification'
import SelectConstruction from './adminSide/construction/SelectConstruction'
import CreateConstruction from './adminSide/construction/addConstruction/CreateConstruction'
import EditConstruction from './adminSide/construction/editConstruction/EditConstruction'
import EditBundleConstructionSchedule from './adminSide/construction/editConstruction/EditBundleConstructionSchedule'
import DeleteBundleConstructionSchedule from './adminSide/construction/editConstruction/DeleteBundleConstructionSchedule'
import DeleteBundleInvReservationSchedule from './adminSide/invReservation/editInvReservation/DeleteBundleInvReservationSchedule'
import ConstructionDetail from './adminSide/construction/constructionDetail/ConstructionDetail'
import ConstructionDetailRouter from './adminSide/construction/constructionDetail/ConstructionDetailRouter'
import ConstructionSiteList from './adminSide/construction/constructionDetail/ConstructionSiteList'
import EditSite from './adminSide/site/editSite/EditSite'
import CreateSite from './adminSide/site/addSite/CreateSite'
import EditInvReservation from './adminSide/invReservation/editInvReservation/EditInvReservation'
import EditInvRequest from './adminSide/invRequest/editInvRequest/EditInvRequest'
import CreateInvReservation from './adminSide/invReservation/addInvReservation/CreateInvReservation'
import InvReservationArrangementManage from './adminSide/invReservation/invReservationDetail/InvReservationArrangementManage'
import SiteAttendanceManage from './adminSide/site/siteDetail/SiteAttendanceManage'
import SiteDetail from './adminSide/site/siteDetail/SiteDetail'
import InvRequestDetail from './adminSide/invRequest/invRequestDetail/InvRequestDetail'
import InvReservationDetail from './adminSide/transaction/invReservationDetail/InvReservationDetail'
import { SelectedAttendanceType } from './adminSide/attendance/AllSiteAttendancesManage'
import EditBundleAttendance from './adminSide/attendance/EditBundleAttendance'
import EditBundleAllSiteAttendances from './adminSide/attendance/EditBundleAllSiteAttendances'
import InvReservationDetailRouter from './adminSide/transaction/invReservationDetail/InvReservationDetailRouter'
import InvReservationInvRequestList from './adminSide/transaction/invReservationDetail/InvReservationInvRequestList'
import AddReservation from './adminSide/site/siteDetail/AddReservation'
import AddMyWorker from './adminSide/worker/addWorker/AddMyWorker'
import SelectWorkerCreateWay from './adminSide/worker/addWorker/SelectWorkerCreateWay'
import InviteMyWorker from './adminSide/worker/addWorker/InviteMyWorker'
import EditEmail from './adminSide/worker/editWorker/EditEmail'
import EditName from './adminSide/worker/editWorker/EditName'
import EditNickname from './adminSide/worker/editWorker/EditNickname'
import EditPassword from './adminSide/worker/editWorker/EditPassword'
import EditPhoneNumber from './adminSide/worker/editWorker/EditPhoneNumber'
import EditTitle from './adminSide/worker/editWorker/EditTitle'
import EditCompanyRole from './adminSide/worker/editWorker/EditCompanyRole'
import EditDepartments from './adminSide/worker/editWorker/EditDepartments'
import EditIsOfficeWorker from './adminSide/worker/editWorker/EditIsOfficeWorker'
import EditOffDaysOfWeek from './adminSide/worker/editWorker/EditOffDaysOfWeek'
import EditOtherOffDays from './adminSide/worker/editWorker/EditOtherOffDays'
import EditLeftDate from './adminSide/worker/editWorker/EditLeftDate'
import WorkerAttendanceList from './adminSide/worker/workerDetail/WorkerAttendanceList'
import WorkerDetailRouter from './adminSide/worker/workerDetail/WorkerDetailRouter'
import WorkerProfile from './adminSide/worker/workerDetail/WorkerProfile'
import ContractingProjectDetailRouter from './adminSide/transaction/contractingProjectDetail/ContractingProjectDetailRouter'
import ContractingProjectDetail from './adminSide/transaction/contractingProjectDetail/ContractingProjectDetailRouter'
import ContractingProjectConstructionList from './adminSide/transaction/contractingProjectDetail/ContractingProjectConstructionList'
import CreateProject from './adminSide/transaction/addTransaction/CreateProject'
import EditProject from './adminSide/transaction/editTransaction/EditProject'
import CreateRequest from './adminSide/transaction/addTransaction/CreateRequest'
import EditRequest from './adminSide/transaction/editTransaction/EditRequest'
import CreateContract from './adminSide/transaction/addTransaction/CreateContract'
import EditContract from './adminSide/transaction/editTransaction/EditContract'
import ContractingProjectList from './adminSide/transaction/ContractingProjectList'
import ContractLogList from './adminSide/transaction/ContractLogList'
import ConstructionList from './adminSide/transaction/ConstructionList'
import TransactionListRouter from './adminSide/transaction/TransactionListRouter'
import RequestList from './adminSide/transaction/RequestList'
import AdminChatListRouter from './adminSide/chat/chatList/AdminChatListRouter'
import AdminChatDetail from './adminSide/chat/chatDetail/AdminChatDetail'
import AdminChatSettings from './adminSide/chat/chatSettings/AdminChatSettings'
import AdminSelectIndividual from './adminSide/chat/chatGroupMembers/AdminSelectIndividual'
import AdminSelectUsersForCustomGroup from './adminSide/chat/chatGroupMembers/AdminSelectUsersForCustomGroup'
import AdminSelectUsersForPCCOC from './adminSide/chat/chatGroupMembers/AdminSelectUsersForPCCOC'
import AdminEditGroupName from './adminSide/chat/chatSettings/AdminEditGroupName'
import AdminEditChatAdmin from './adminSide/chat/chatSettings/AdminEditChatAdmin'
import AdminSelectOnetooneOrCustom from './adminSide/chat/chatSettings/AdminSelectOnetooneOrCustom'
import ReceiveList from './adminSide/transaction/ReceiveList'
import OrderList from './adminSide/transaction/OrderList'

// 現場サイド(WorkerSide)
import WSelectAccount from './workerSide/WSelectAccount'
import WSignUpAccount from './workerSide/WSignUpAccount'
import WNotification from './workerSide/WNotification'
import CreateWorker from './workerSide/CreateWorker'
import WorkerHome from './workerSide/WorkerHome'
import AttendancePopup, { PopupType } from './workerSide/attendance/AttendancePopup'
import MyAttendanceList from './workerSide/mypage/MyAttendanceList'
import MyPageRouter from './workerSide/mypage/MyPageRouter'
import MyProfile from './workerSide/mypage/MyProfile'
import MySettings from './workerSide/mypage/MySettings'
import WEditEmail from './workerSide/mypage/editMyProfile/WEditEmail'
import WEditName from './workerSide/mypage/editMyProfile/WEditName'
import WEditNickname from './workerSide/mypage/editMyProfile/WEditNickname'
import WEditPassword from './workerSide/mypage/editMyProfile/WEditPassword'
import WEditPhoneNumber from './workerSide/mypage/editMyProfile/WEditPhoneNumber'
import WEditComment from './workerSide/attendance/WEditComment'
import WSiteDetail from './workerSide/siteDetail/WSiteDetail'
import WSiteRouter from './workerSide/siteDetail/WSiteRouter'
import WSiteWorkerList from './workerSide/siteDetail/WSiteWorkerList'
import WAddInvitedURL from './workerSide/WAddInvitedURL'
import WorkerChatListRouter from './workerSide/chat/chatList/WorkerChatListRouter'
import WorkerChatDetail from './workerSide/chat/chatDetail/WorkerChatDetail'
import WorkerChatSettings from './workerSide/chat/chatSettings/WorkerChatSettings'
import WorkerSelectIndividual from './workerSide/chat/chatGroupMembers/WorkerSelectIndividual'
import WorkerSelectUsersForCustomGroup from './workerSide/chat/chatGroupMembers/WorkerSelectUsersForCustomGroup'
import WorkerSelectUsersForPCCOC from './workerSide/chat/chatGroupMembers/WorkerSelectUsersForPCCOC'
import WorkerEditGroupName from './workerSide/chat/chatSettings/WorkerEditGroupName'
import WorkerEditChatAdmin from './workerSide/chat/chatSettings/WorkerEditChatAdmin'
import WorkerSelectOnetooneOrCustom from './workerSide/chat/chatSettings/WorkerSelectOnetooneOrCustom'

import CorecaAdminDashboard from './adminSide/mypage/CorecaAdminDashboard'

import SelectMenu, { SelectMenuParams } from './common/SelectMenu'
import { Licenses } from './common/Licenses'
import LanguageSelector from './common/LanguageSelector'

import { NavIcon } from '../components/organisms/NavIcon'
import { BlueColor, GreenColor, FontStyle } from './../utils/Styles'
import { Icon } from '../components/atoms/Icon'
import { IPHONEX_BOTTOM_HEIGHT, THEME_COLORS } from '../utils/Constants'

import { setActiveDepartments, setBelongCompanyId, setCheckedSignIn, setSignInUser } from '../stores/AccountSlice'
import { Toast } from '../components/atoms/Toast'
import * as Linking from 'expo-linking'
import { WeekOfDay } from '../utils/ext/Date.extensions'
import { CustomDate, newCustomDate } from '../models/_others/CustomDate'
import { BottomSheet } from '../components/template/BottomSheet'
import { _getCompanyOfAccount } from '../services/company/CompanyService'
import { LoadingScreen } from '../components/template/LoadingScreen'
import { SelectCompanyType } from './adminSide/company/SelectCompany'
import { SelectConstructionType } from './adminSide/construction/SelectConstruction'
import { getNextRoute, getOnlyCompanyName, goToNotificationTarget } from '../usecases/RouteCase'
import { navigate, navigationRef } from './RootNavigation'
import { CustomResponse } from '../models/_others/CustomResponse'
import { _getAccount, _logout, _updateAccount } from '../services/account/AccountService'
import { CompanyRoleEnumType } from '../models/worker/CompanyRoleEnumType'
import SelectProjectType from './adminSide/transaction/editTransaction/SelectProjectType'
import { GetSameNameWorkersResponse, _getWorkerTags } from '../services/worker/WorkerService'
import { checkSignInAndSetToStore } from '../usecases/account/LoginSignUpCase'
import { LocationInfoType } from '../models/_others/LocationInfoType'
import { getErrorToastMessage } from '../services/_others/ErrorService'
import BillingInquiry from './adminSide/inquiry/BillingInquiryScreen'
import ProblemsInquiry from './adminSide/inquiry/ProblemsInquiryScreen'
import { WorkerCLType } from '../models/worker/Worker'
import { CompanyCLType, CompanyType } from '../models/company/Company'
import { _getAuthUser } from '../services/firebase/AuthService'
import { _getHolidayList } from '../services/_others/HolidaySercvice'
import { InstructionCLType } from '../models/instruction/Instruction'
//import ChatRoleForCustomGroup from '../components/organisms/chat/chatRole/ChatRoleForCustomGroup'
import CustomBottomTab from '../components/template/CustomBottomTab'
import { ConstructionCLType } from '../models/construction/Construction'
import { ProjectType } from '../models/project/Project'
import AdminChatNoteList from './adminSide/chat/chatNote/AdminChatNoteList'
import WorkerChatNoteList from './workerSide/chat/chatNote/WorkerChatNoteList'
import AdminAddNote from './adminSide/chat/chatNote/AdminAddNote'
import WorkerAddNote from './workerSide/chat/chatNote/WorkerAddNote'
import AdminTodoListRouter from './adminSide/chat/todoList/AdminTodoListRouter'
import WorkerTodoListRouter from './workerSide/chat/todoList/WorkerTodoListRouter'
import { updateUserInfo } from '../usecases/userInfo/userInfoCase'
import { resetAllCachedData } from '../usecases/CachedDataCase'
import CreateProjectAndConstruction from './adminSide/CreateProjectAndConstruction'

export type DefaultStackType = Partial<{
    target?: string
    backTitle?: string
    animation?: 'none' | 'fade' | 'slide' | 'modal'
    update?: number
}>

/**
 * navigation.push(ScreenName, param)のparamの定義
 */
export type RootStackParamList = Partial<{
    Default: DefaultStackType
    SelectMenu: {
        selectMenu: SelectMenuParams
    } & DefaultStackType
    SelectAccount: DefaultStackType
    SelectDepartment: DefaultStackType
    SignInAccount: DefaultStackType
    SignUpAccount: DefaultStackType
    AddInviteURL: DefaultStackType
    AdminHomeRouter: DefaultStackType
    BusinessTypeSelect: DefaultStackType
    Launch: DefaultStackType
    CreateMyCompany: {
        ownerName?: string
        sameNameWorkers?: GetSameNameWorkersResponse
    } & DefaultStackType
    CreateOwnerWorker: DefaultStackType
    ResetPassword: DefaultStackType
    MySchedule: DefaultStackType
    AttendanceDetail: {
        arrangementId?: string
        attendanceId?: string
        siteId: string
    } & DefaultStackType
    PartnerCompanyList: DefaultStackType
    SelectCompany: {
        selectCompany: SelectCompanyType
        initStartDate?: CustomDate
        routeNameFrom?: string
        constructionIds?: string[]
        invRequestId?: string
        siteId?: string
    } & DefaultStackType
    DepartmentManage: {
        companyId?: string
    } & DefaultStackType
    CreateDepartment: {
        departmentNum: number
    } & DefaultStackType
    EditDepartment: {
        mode: string
        departmentId?: string
        companyId?: string
        departmentNum?: number
    } & DefaultStackType
    CreateFakeCompany: {
        routeNameFrom?: string
        targetDate?: CustomDate
    } & DefaultStackType
    InviteCompany: DefaultStackType
    SelectCompanyCreateWay: {
        routeNameFrom?: string
        targetDate?: CustomDate
    } & DefaultStackType
    CompanyDetail: {
        companyId: string
    } & DefaultStackType
    CompanyDetailRouter: {
        title?: string
        companyId?: string
    } & DefaultStackType
    CompanyInvoice: {
        companyId: string
    } & DefaultStackType
    EditFakeCompany: {
        companyId: string
        routeNameFrom?: string
        targetDate?: CustomDate
    } & DefaultStackType
    EditMyCompany: {
        ownerName?: string
        sameNameWorkers?: GetSameNameWorkersResponse
    } & DefaultStackType
    EditBundleAllSiteAttendances: {
        date?: CustomDate
        siteIds?: string[]
        selectedAttendances?: SelectedAttendanceType[]
    } & DefaultStackType
    DateRouter: { date: CustomDate } & DefaultStackType
    ArrangementHome: DefaultStackType
    AttendanceHome: DefaultStackType
    AdminHome: DefaultStackType
    SelectSiteCreateOption: {
        targetMonth?: CustomDate
        targetDate?: CustomDate
    } & DefaultStackType
    AdminMyPageRouter: {
        isHeaderLeftBack: boolean
    } & DefaultStackType
    AdminSettings: DefaultStackType
    MyCompanyDetail: DefaultStackType
    MyCompanyWorkerList: DefaultStackType
    AdminNotification: DefaultStackType
    CreateProjectAndConstruction: {
        selectedDate?: CustomDate
        initStartDate?: CustomDate
        routeNameFrom?: string
    }
    SelectConstruction: {
        selectConstruction: SelectConstructionType
    } & DefaultStackType
    CreateConstruction: {
        contractId?: string
        routeNameFrom?: string
        selectedDate?: CustomDate
        siteDate?: CustomDate
    } & DefaultStackType
    EditConstruction: {
        constructionId?: string
        contractId?: string
        isInstruction?: boolean
        instructionId?: string
        routeNameFrom?: string
        selectedDate?: CustomDate
        siteDate?: CustomDate
    } & DefaultStackType
    EditBundleConstructionSchedule: {
        constructionId?: string
        isInstruction?: boolean
        instructionId?: string
    } & DefaultStackType
    DeleteBundleConstructionSchedule: {
        constructionId?: string
        isInstruction?: boolean
        instructionId?: string
    } & DefaultStackType
    DeleteBundleInvReservationSchedule: {
        invReservation?: string
        invReservationId?: string
    } & DefaultStackType
    ConstructionDetail: DefaultStackType
    ConstructionDetailRouter: {
        title?: string
        constructionId?: string
        projectId?: string
        startDate?: CustomDate | number
        relatedCompanyId?: string
        isNewProject?: boolean
        contractor?: CompanyType
        supportType?: 'support-order' | 'support-receive'
    } & DefaultStackType
    ConstructionSiteList: DefaultStackType
    EditSite: {
        mode?: string
        siteId?: string
        constructionId?: string
        construction?: ConstructionCLType
        projectId: string
        targetDate?: CustomDate
        targetMonth?: CustomDate
        isInstruction?: boolean
        instructionId?: string
        isFromAdminHomeScreen?: boolean
    } & DefaultStackType
    CreateSite: {
        mode?: string
        constructionId?: string
        construction?: ConstructionCLType
        projectId?: string
        targetDate?: CustomDate
        targetMonth?: CustomDate
        isFromAdminHomeScreen?: boolean
    } & DefaultStackType
    EditInvReservation: {
        mode?: string
        invReservationId?: string
        initStartDate?: CustomDate
        routeNameFrom?: ScreenNameType
    } & DefaultStackType
    EditInvRequest: {
        invRequestId?: string
        invReservationId?: string
        isBundle?: boolean
    } & DefaultStackType
    CreateInvReservation: {
        mode?: string
        initStartDate?: CustomDate
        routeNameFrom?: ScreenNameType
    } & DefaultStackType
    EditRequest: {
        mode: string
        siteId: string
        requestId: string
    } & DefaultStackType
    CreateRequest: {
        mode: string
        siteId: string
    } & DefaultStackType
    InvReservationArrangementManage: {
        invReservationId?: string
    } & DefaultStackType
    SiteAttendanceManage: {
        siteId?: string
        siteNumber?: number
        requestId?: string
        invRequestId?: string
        date?: CustomDate
    } & DefaultStackType
    SiteDetail: {
        title?: string
        siteId?: string
        requestId?: string
        siteNumber?: number
        relatedCompanyId?: string
        instruction?: InstructionCLType
        supportType?: 'support-order' | 'support-receive'
        contractor?: CompanyType
    } & DefaultStackType
    InvRequestDetail: {
        title?: string
        invRequestId?: string
        relatedCompanyId?: string
        instruction?: InstructionCLType
        type?: 'order' | 'receive'
        routeNameFrom?: string
    } & DefaultStackType
    InvReservationDetail: DefaultStackType
    EditBundleAttendance: {
        siteId?: string
        requestId?: string
    } & DefaultStackType
    InvReservationDetailRouter: {
        title?: string
        invReservationId?: string
        type?: 'order' | 'receive'
    } & DefaultStackType
    InvReservationInvRequestList: {
        invReservationId?: string
    } & DefaultStackType
    AddReservation: {
        initStartDate?: number
        companyId?: string
        supportingCompany?: CompanyCLType
    } & DefaultStackType
    AddMyWorker: {
        siteId?: string
        invRequestId?: string
    } & DefaultStackType
    SelectWorkerCreateWay: {
        initStartDate?: number
    } & DefaultStackType
    InviteMyWorker: {
        workerId: string
        workerName: string
        workerNickname: string
    } & DefaultStackType
    EditEmail: {
        workerId: string
        email: string
    } & DefaultStackType
    EditName: {
        workerId: string
        siteId: string
        name: string
    } & DefaultStackType
    EditNickname: {
        workerId: string
        siteId: string
        nickname: string
    } & DefaultStackType
    EditPassword: {
        workerId: string
        password: string
    } & DefaultStackType
    EditPhoneNumber: {
        workerId: string
        phoneNumber: string
    } & DefaultStackType
    EditTitle: {
        workerId: string
        title: string
    } & DefaultStackType
    EditCompanyRole: {
        workerId: string
        companyRole: CompanyRoleEnumType
    } & DefaultStackType
    EditDepartments: {
        workerId: string
    } & DefaultStackType
    EditIsOfficeWorker: {
        workerId: string
        isOfficeWorker: boolean
    } & DefaultStackType
    EditOffDaysOfWeek: {
        workerId: string
        offDaysOfWeek: WeekOfDay[]
    } & DefaultStackType
    EditOtherOffDays: {
        workerId: string
        otherOffDays: CustomDate[]
    } & DefaultStackType
    EditLeftDate: {
        workerId: string
        leftDate: CustomDate
    } & DefaultStackType
    WorkerAttendanceList: DefaultStackType
    WorkerDetailRouter: { title?: string; workerId?: string; arrangementId?: string } & DefaultStackType
    WorkerProfile: DefaultStackType
    ContractingProjectDetailRouter: {
        title?: string
        projectId?: string
        contractId?: string
        constructionIds?: string[]
        isFakeCompanyManage?: boolean
        selectedMonth?: CustomDate
        contractor?: CompanyType
    } & DefaultStackType
    ContractingProjectDetail: {
        projectId: string
    } & DefaultStackType
    ContractingProjectConstructionList: {
        projectId: string
        selectedMonth?: CustomDate
    } & DefaultStackType
    SelectProjectType: DefaultStackType
    CreateProject: {
        isRequestProject?: boolean
        company?: CompanyCLType
        targetDate?: CustomDate
    } & DefaultStackType
    EditProject: {
        projectId?: string
        contractId?: string
        isRequestProject?: boolean
        company?: CompanyCLType
        targetDate?: CustomDate
    } & DefaultStackType
    CreateContract: {
        superConstructionId?: string
        projectId?: string
    } & DefaultStackType
    EditContract: {
        superConstructionId?: string
        projectId?: string
        contractId?: string
    } & DefaultStackType
    TransactionListRouter: DefaultStackType
    RequestList: DefaultStackType
    ReceiveList: DefaultStackType
    OrderList: DefaultStackType
    InvReservationList: DefaultStackType
    ContractingProjectList: {
        targetMonth?: CustomDate
        isFromAdminHomeScreen?: boolean
    } & DefaultStackType
    ContractLogList: {
        contractId?: string
    } & DefaultStackType
    ConstructionList: {
        targetMonth?: CustomDate
        targetDate?: CustomDate
        onPressProject?: (project?: ProjectType) => void
        displayType?: 'project' | 'support'
        routeNameFrom?: ScreenNameType
    } & DefaultStackType
    WSelectAccount: DefaultStackType
    WSignUpAccount: DefaultStackType
    WNotification: DefaultStackType
    CreateWorker: DefaultStackType
    WorkerHome: DefaultStackType
    AttendancePopup: {
        attendanceId?: string
        arrangementId?: string
        type: PopupType
        location?: LocationInfoType
        disableCloseButton?: boolean
        cachedWorkerHomeKey?: string
    } & DefaultStackType
    MyAttendanceList: DefaultStackType
    MyPageRouter: DefaultStackType
    MyProfile: DefaultStackType
    MySettings: DefaultStackType
    WEditEmail: {
        workerId: string
        email: string
    } & DefaultStackType
    WEditName: {
        workerId: string
        name: string
    } & DefaultStackType
    WEditNickname: {
        workerId: string
        nickname: string
    } & DefaultStackType
    WEditPassword: {
        workerId: string
        password: string
    } & DefaultStackType
    WEditPhoneNumber: {
        workerId: string
        phoneNumber: string
    } & DefaultStackType
    WEditComment: {
        comment: string
        onClose: (comment: string | undefined) => void
    } & DefaultStackType
    WSiteDetail: DefaultStackType
    WSiteRouter: {
        title?: string
        siteId?: string
    } & DefaultStackType
    WSiteWorkerList: DefaultStackType
    WAddInvitedURL: DefaultStackType
    Licenses: DefaultStackType
    LanguageSelector: DefaultStackType
    BillingInquiry: {
        worker?: WorkerCLType
        company?: CompanyCLType
        workerId?: string
        companyId?: string
    } & DefaultStackType
    ProblemsInquiry: {
        worker?: WorkerCLType
        company?: CompanyCLType
    } & DefaultStackType
    AdminChatListRouter: DefaultStackType
    WorkerChatListRouter: DefaultStackType
    ChatRoleForCustomGroup: DefaultStackType
    ChatDetail: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    AdminChatDetail: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    WorkerChatDetail: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    AdminChatNoteList: {
        roomId: string
        threadId: string
    } & DefaultStackType
    WorkerChatNoteList: {
        roomId: string
        threadId: string
    } & DefaultStackType
    AdminAddNote: {
        roomId: string
        threadId: string
    } & DefaultStackType
    WorkerAddNote: {
        roomId: string
        threadId: string
    } & DefaultStackType
    ChatThread: DefaultStackType
    AdminChatSettings: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    WorkerChatSettings: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    AdminSelectUsersForCustomGroup: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    WorkerSelectUsersForCustomGroup: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    AdminSelectUsersForPCCOC: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    WorkerSelectUsersForPCCOC: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    AdminSelectIndividual: DefaultStackType
    WorkerSelectIndividual: DefaultStackType
    AdminEditGroupName: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    WorkerEditGroupName: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    AdminEditChatAdmin: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    WorkerEditChatAdmin: {
        roomId: string
        threadId: string
        name: string
    } & DefaultStackType
    AdminSelectOnetooneOrCustom: DefaultStackType
    WorkerSelectOnetooneOrCustom: DefaultStackType
    AdminTodoListRouter: DefaultStackType
    WorkerTodoListRouter: DefaultStackType
    AdminOngoingTodoList: DefaultStackType
    WorkerOngoingTodoList: DefaultStackType
    AdminCompletedTodoList: DefaultStackType
    WorkerCompletedTodoList: DefaultStackType
    CorecaAdminDashboard: DefaultStackType
}>

export type ScreenNameType = keyof RootStackParamList

// const BottomTab = createMaterialBottomTabNavigator<RootStackParamList>()
const Navigator = createStackNavigator<RootStackParamList>()
const adminOption: StackNavigationOptions = {
    headerRight: () => {
        return (
            <View
                style={{
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                }}>
                <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />
                <NavIcon
                    style={{
                        marginTop: 2,
                        marginRight: -5,
                    }}
                    colorStyle={BlueColor}
                    navFunctionType={'update'}
                />
            </View>
        )
    },
    headerLeft: (props: any) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'back'} />,
    headerStyle: {
        backgroundColor: BlueColor.mainColor,
        shadowColor: 'transparent', //ここ(iOS)
        shadowOpacity: 0, // ここ(iOSはこちらでも可)
        elevation: 0, // ここ(Android)
    },
    headerTintColor: BlueColor.textColor,
}

const workerOption: StackNavigationOptions = {
    headerRight: () => {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                <NavIcon
                    style={{
                        marginTop: 2,
                        marginRight: -5,
                    }}
                    colorStyle={GreenColor}
                    navFunctionType={'update'}
                />
                <NavIcon colorStyle={GreenColor} navFunctionType={'worker_menu'} />
            </View>
        )
    },
    headerLeft: (props: any) => <NavIcon {...props} colorStyle={GreenColor} navFunctionType={'back'} />,
    headerStyle: {
        backgroundColor: GreenColor.mainColor,
        shadowColor: 'transparent', //ここ(iOS)
        shadowOpacity: 0, // ここ(iOSはこちらでも可)
        elevation: 0, // ここ(Android)
    },
    headerTintColor: GreenColor.textColor,
}

const Router = () => {
    const backTitle = useSelector((state: StoreType) => state?.nav?.backTitle)
    const urlScheme = useSelector((state: StoreType) => state?.nav?.urlScheme)
    const linkingAddListenerCount = useSelector((state: StoreType) => state?.nav?.linkingAddListenerCount)
    const toastMessage = useSelector((state: StoreType) => state.util.toastMessage)
    const loading = useSelector((state: StoreType) => state.util.loading)
    const loadingString = useSelector((state: StoreType) => state.util.loadingString)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const isSignUping = useSelector((state: StoreType) => state.account.isSignUping)
    const isLogining = useSelector((state: StoreType) => state.account.isLogining)
    const isDev = useSelector((state: StoreType) => state.account.isDev)
    const dispatch = useDispatch()
    const { t } = useTextTranslation()

    useEffect(() => {
        const showListener = Keyboard.addListener('keyboardDidShow', _keyboardDidShow)
        const hideListener = Keyboard.addListener('keyboardDidHide', _keyboardDidHide)
        return () => {
            showListener.remove()
            hideListener.remove()
        }
    }, [])

    const _keyboardDidShow = () => {
        dispatch(setKeyboardOpen(true))
    }

    const _keyboardDidHide = () => {
        dispatch(setKeyboardOpen(false))
    }

    useEffect(() => {
        const authSubscribe = _getAuthUser().onAuthStateChanged(async (user) => {
            try {
                if (user) {
                    /**
                     * 新規作成中、ログイン中は飛ばす。
                     */
                    if (isSignUping || isLogining) {
                        return
                    }
                    /**
                     * アカウント情報が正しいかどうかチェック。
                     */
                    const result = await checkSignInAndSetToStore({
                        accountId: user.uid,
                        dispatch,
                    })
                    if (result.error) {
                        throw {
                            ...result,
                        }
                    }
                } else {
                    dispatch(setSignInUser(undefined))
                    dispatch(setActiveDepartments(undefined))
                    dispatch(setBelongCompanyId(undefined))
                }
                dispatch(setCheckedSignIn(true))
            } catch (error) {
                dispatch(setSignInUser(undefined))
                dispatch(setActiveDepartments(undefined))
                dispatch(setBelongCompanyId(undefined))
                dispatch(setCheckedSignIn(true))
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })
        return () => {
            authSubscribe()
        }
    }, [isSignUping, isLogining])

    /**
     * 祝日を更新
     */
    useEffect(() => {
        ;(async () => {
            const holidayResult = await _getHolidayList()
            dispatch(setHolidays(holidayResult.success))
        })()
    }, [])

    const _onReceiveUrl = (event: Linking.EventType) => {
        dispatch(setUrlScheme(Linking.parse(event.url) as URLScheme))
    }

    useEffect(() => {
        if (urlScheme?.path == undefined) {
            return
        }

        ;(async () => {
            try {
                const urlSchemePath = (urlScheme?.path as string).replace('--/', '')
                const rtnRoute = await getNextRoute('Router', urlSchemePath, signInUser)
                if (rtnRoute.error) {
                    throw {
                        error: rtnRoute.error,
                    }
                }
                if (rtnRoute != undefined) {
                    let retCompanyName: string | undefined = ''
                    if (urlScheme?.queryParams.companyId != undefined) {
                        const result = await getOnlyCompanyName(urlScheme?.queryParams.companyId as unknown as string)
                        retCompanyName = result.success
                    }
                    rtnRoute.success?.forEach((route) => {
                        if (route != 'CompanyDetailRouter') {
                            navigate(route, undefined)
                        } else {
                            navigate(route, { companyId: urlScheme?.queryParams.companyId, title: retCompanyName })
                        }
                    })
                }
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })()

        return () => {
            //Linking.removeEventListener('url', _onReceiveUrl)
        }
    }, [urlScheme])

    //アプリ起動時に一回だけチェック。
    if (linkingAddListenerCount == 0) {
        dispatch(setLinkingAddListenerCount(1))
        Linking.addEventListener('url', _onReceiveUrl)

        Linking.getInitialURL().then((url) => {
            if (url != undefined && url.indexOf('?') > 0) {
                dispatch(setLoading('unTouchable'))
                dispatch(setLoadingString('招待処理準備中...'))
                setTimeout(() => {
                    dispatch(setUrlScheme(Linking.parse(url) as URLScheme))
                    dispatch(setLoadingString(undefined))
                    dispatch(setLoading(false))
                }, 8000)
            }
        })
    }

    /*
    // アプリがフォアグラウンドの状態で通知を受信したときに起動
    Notifications.addNotificationReceivedListener(notification => {
        // notificationには通知内容が含まれています
        //setNotification(notification)
        alert(notification)
    })
  
    // ユーザーが通知をタップまたは操作したときに発生します
    // （アプリがフォアグラウンド、バックグラウンド、またはキルされたときに動作します）
    Notifications.addNotificationResponseReceivedListener(response => {
    })
    */

    const responseListener: any = useRef()

    useEffect(() => {
        responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const data = response.notification.request.content.data
            await goToNotificationTarget(signInUser, navigate, data, dispatch)
        })

        return () => {
            Notifications.removeNotificationSubscription(responseListener.current)
        }
    }, [])

    /**
     * 退会済みのアカウントかどうか。アクセスを制限するため。
     */
    const isLeft = useMemo(() => {
        return signInUser?.worker?.workerTags?.includes('left-business')
    }, [signInUser])

    /**
     * 管理者かどうか
     */
    const isAdmin = useMemo(() => {
        return !signInUser?.worker?.workerTags?.includes('left-business') && (signInUser?.worker?.companyRole == 'manager' || signInUser?.worker?.companyRole == 'owner')
    }, [signInUser])

    /**
     * ログイン後かどうか。
     */
    const afterSignIn = useMemo(() => {
        return (signInUser != undefined && isLeft != true) || isDev
    }, [signInUser, isLeft, isDev])

    /**
     * アプリがforegroundかbackgroundのいずれか
     *
     */

    const appState = useRef(AppState.currentState)

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                if (signInUser?.workerId) {
                    updateUserInfo({ userInfoId: signInUser?.workerId, lastLoggedInAt: newCustomDate().totalSeconds })
                    if (Constants.expoConfig?.version != signInUser?.lastLoggedInVersion) {
                        //最終ログインバージョンの取得
                        //バージョンが違った場合はキャッシュを削除して更新
                        resetAllCachedData()
                        _updateAccount({
                            accountId: signInUser.accountId,
                            lastLoggedInVersion: Constants.expoConfig?.version,
                        })
                    }
                }
            }

            appState.current = nextAppState
        })

        return () => {
            subscription.remove()
        }
    }, [signInUser])

    useEffect(() => {
        if (signInUser?.workerId) {
            updateUserInfo({ userInfoId: signInUser?.workerId, lastLoggedInAt: newCustomDate().totalSeconds })
            if (Constants.expoConfig?.version != signInUser?.lastLoggedInVersion) {
                //最終ログインバージョンの取得
                //バージョンが違った場合はキャッシュを削除して更新
                resetAllCachedData()
                _updateAccount({
                    accountId: signInUser.accountId,
                    lastLoggedInVersion: Constants.expoConfig?.version,
                })
            }
        }
    }, [signInUser])

    return (
        <>
            <NavigationContainer
                onStateChange={(state) => {
                    const route = state?.routes[state.index]
                    const params = route?.params as DefaultStackType
                    dispatch(setBackTitle(params?.backTitle ?? ''))
                    dispatch(setRouteName(route?.name ?? undefined))
                }}
                ref={navigationRef}>
                <Navigator.Navigator
                    initialRouteName={'Launch'}
                    screenOptions={({ route: { params } }) => {
                        let animation = CardStyleInterpolators.forHorizontalIOS
                        if (params?.animation != undefined) {
                            switch (params?.animation) {
                                case 'fade':
                                    animation = CardStyleInterpolators.forFadeFromCenter
                                    break
                                case 'slide':
                                    animation = CardStyleInterpolators.forHorizontalIOS
                                    break
                                case 'modal':
                                    animation = CardStyleInterpolators.forVerticalIOS
                                    break
                                case 'none':
                                    animation = CardStyleInterpolators.forNoAnimation
                                    break
                            }
                        }
                        return {
                            cardStyleInterpolator: animation,
                            headerBackTitleStyle: {
                                fontSize: 9,
                                fontFamily: FontStyle.regular,
                            },
                            headerTitleStyle: {
                                fontSize: 13,
                                fontFamily: FontStyle.bold,
                            },
                            headerStyle: {
                                zIndex: 10,
                            },
                            cardStyle: {
                                backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
                            },
                            headerTruncatedBackTitle: t('common:GoBack'),
                            headerBackAllowFontScaling: false,
                            headerBackTitle: backTitle ?? undefined,
                            headerBackTitleVisible: true,
                            cardOverlayEnabled: true,
                            cardShadowEnabled: false,
                            headerBackImage: (props: any) => {
                                return (
                                    <View style={{ paddingLeft: 2, paddingVertical: 10 }}>
                                        <Icon name={'back'} fill={props.tintColor} width={18} height={18} />
                                    </View>
                                )
                            },
                            headerTitleAlign: 'center',
                        }
                    }}>
                    {afterSignIn == true ? (
                        <>
                            {/* ログイン後に遷移可能な画面定義 */}
                            {/* 管理サイド */}
                            <Navigator.Group
                                screenOptions={() => {
                                    return adminOption
                                }}>
                                {isAdmin == true && (
                                    <>
                                        <Navigator.Screen
                                            name="PartnerCompanyList"
                                            component={PartnerCompanyList}
                                            options={{
                                                title: t('admin:CustomerBusinessPartnerList'),
                                                headerLeft: () => {
                                                    return <NavIcon colorStyle={BlueColor} navFunctionType={'admin_notification'} withBatch />
                                                },
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="MySchedule"
                                            component={MySchedule}
                                            options={{
                                                headerLeft: () => {
                                                    return <NavIcon colorStyle={BlueColor} navFunctionType={'admin_notification'} withBatch />
                                                },
                                                title: t('admin:MySchedule'),
                                            }}
                                        />
                                        <Navigator.Screen name="SelectCompany" component={SelectCompany} options={{}} />
                                        <Navigator.Screen name="DepartmentManage" component={DepartmentManage} options={{}} />
                                        <Navigator.Screen name="CreateDepartment" component={CreateDepartment} options={{}} />
                                        <Navigator.Screen name="EditDepartment" component={EditDepartment} options={{}} />
                                        <Navigator.Screen name="CreateFakeCompany" component={CreateFakeCompany} options={{}} />
                                        <Navigator.Screen name="InviteCompany" component={InviteCompany} options={{}} />
                                        <Navigator.Screen name="SelectCompanyCreateWay" component={SelectCompanyCreateWay} options={{}} />
                                        <Navigator.Screen name="CompanyDetail" component={CompanyDetail} options={{}} />
                                        <Navigator.Screen name="CompanyDetailRouter" component={CompanyDetailRouter} options={{}} />
                                        <Navigator.Screen name="CompanyInvoice" component={CompanyInvoice} options={{}} />
                                        <Navigator.Screen name="EditFakeCompany" component={EditFakeCompany} options={{}} />
                                        <Navigator.Screen
                                            name="EditMyCompany"
                                            component={EditMyCompany}
                                            options={{
                                                title: t('admin:EditYourCompany'),
                                            }}
                                        />
                                        <Navigator.Screen name="DateRouter" component={DateRouter} options={{}} />
                                        <Navigator.Screen name="EditBundleAllSiteAttendances" component={EditBundleAllSiteAttendances} options={{}} />
                                        <Navigator.Screen
                                            name="AdminMyPageRouter"
                                            component={AdminMyPageRouter}
                                            options={({ route: { params } }) => {
                                                if (!params?.isHeaderLeftBack) {
                                                    return {
                                                        headerLeft: () => {
                                                            return <NavIcon colorStyle={BlueColor} navFunctionType={'admin_notification'} withBatch />
                                                        },
                                                        title: t('admin:CompanyPage'),
                                                    }
                                                }
                                                return {
                                                    title: t('admin:CompanyPage'),
                                                }
                                            }}
                                        />
                                        <Navigator.Screen name="AdminSettings" component={AdminSettings} options={{}} />
                                        <Navigator.Screen name="MyCompanyDetail" component={MyCompanyDetail} options={{}} />
                                        <Navigator.Screen name="MyCompanyWorkerList" component={MyCompanyWorkerList} options={{}} />
                                        <Navigator.Screen
                                            name="AdminNotification"
                                            component={AdminNotification}
                                            options={{
                                                presentation: 'modal',
                                                cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                                                headerLeft: () => {
                                                    return <NavIcon colorStyle={BlueColor} navFunctionType={'none'} />
                                                },
                                                headerRight: () => {
                                                    return <NavIcon colorStyle={BlueColor} navFunctionType={'close'} />
                                                },
                                                title: t('admin:News'),
                                            }}
                                        />
                                        <Navigator.Screen name="CreateProjectAndConstruction" component={CreateProjectAndConstruction} options={{}} />
                                        <Navigator.Screen name="SelectConstruction" component={SelectConstruction} options={{}} />
                                        <Navigator.Screen name="CreateConstruction" component={CreateConstruction} options={{}} />
                                        <Navigator.Screen name="EditConstruction" component={EditConstruction} options={{}} />
                                        <Navigator.Screen
                                            name="EditBundleConstructionSchedule"
                                            component={EditBundleConstructionSchedule}
                                            options={{
                                                title: t('admin:EditInBulk'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="DeleteBundleConstructionSchedule"
                                            component={DeleteBundleConstructionSchedule}
                                            options={{
                                                title: t('admin:DeleteInBulk'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="DeleteBundleInvReservationSchedule"
                                            component={DeleteBundleInvReservationSchedule}
                                            options={{
                                                title: t('admin:DeleteInBulk'),
                                            }}
                                        />
                                        <Navigator.Screen name="ConstructionDetail" component={ConstructionDetail} options={{}} />
                                        <Navigator.Screen name="ConstructionDetailRouter" component={ConstructionDetailRouter} options={{}} />
                                        <Navigator.Screen name="ConstructionSiteList" component={ConstructionSiteList} options={{}} />
                                        <Navigator.Screen name="EditSite" component={EditSite} options={{}} />
                                        <Navigator.Screen name="CreateSite" component={CreateSite} options={{}} />
                                        <Navigator.Screen name="InvReservationArrangementManage" component={InvReservationArrangementManage} options={{}} />
                                        <Navigator.Screen name="SiteAttendanceManage" component={SiteAttendanceManage} options={{}} />
                                        <Navigator.Screen name="SiteDetail" component={SiteDetail} options={{}} />
                                        <Navigator.Screen name="EditBundleAttendance" component={EditBundleAttendance} options={{}} />
                                        <Navigator.Screen name="InvRequestDetail" component={InvRequestDetail} options={{}} />
                                        <Navigator.Screen name="EditInvReservation" component={EditInvReservation} options={{}} />
                                        <Navigator.Screen name="EditInvRequest" component={EditInvRequest} options={{}} />
                                        <Navigator.Screen name="CreateInvReservation" component={CreateInvReservation} options={{}} />
                                        <Navigator.Screen name="InvReservationDetail" component={InvReservationDetail} options={{}} />
                                        <Navigator.Screen name="InvReservationDetailRouter" component={InvReservationDetailRouter} options={{}} />
                                        <Navigator.Screen name="InvReservationInvRequestList" component={InvReservationInvRequestList} options={{}} />
                                        <Navigator.Screen name="AddReservation" component={AddReservation} options={{}} />
                                        <Navigator.Screen name="AddMyWorker" component={AddMyWorker} options={{}} />
                                        <Navigator.Screen name="SelectWorkerCreateWay" component={SelectWorkerCreateWay} options={{}} />
                                        <Navigator.Screen name="InviteMyWorker" component={InviteMyWorker} options={{}} />
                                        <Navigator.Screen
                                            name="EditEmail"
                                            component={EditEmail}
                                            options={{
                                                title: t('admin:ChangeEmailAddress'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditName"
                                            component={EditName}
                                            options={{
                                                title: t('admin:Name'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditNickname"
                                            component={EditNickname}
                                            options={{
                                                title: t('admin:Nickname'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditPassword"
                                            component={EditPassword}
                                            options={{
                                                title: t('admin:EditPassword'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditPhoneNumber"
                                            component={EditPhoneNumber}
                                            options={{
                                                title: t('admin:PhoneNumber'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditTitle"
                                            component={EditTitle}
                                            options={{
                                                title: t('admin:Title'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditCompanyRole"
                                            component={EditCompanyRole}
                                            options={{
                                                title: t('admin:CorporateAuthority'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditDepartments"
                                            component={EditDepartments}
                                            options={{
                                                title: t('admin:AssignDepartments'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditIsOfficeWorker"
                                            component={EditIsOfficeWorker}
                                            options={{
                                                title: t('admin:AreYouAConstructionWorker'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditOffDaysOfWeek"
                                            component={EditOffDaysOfWeek}
                                            options={{
                                                title: t('admin:Holiday'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditOtherOffDays"
                                            component={EditOtherOffDays}
                                            options={{
                                                title: t('admin:OtherHolidays'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="EditLeftDate"
                                            component={EditLeftDate}
                                            options={{
                                                title: t('admin:DateOfWithdrawal'),
                                            }}
                                        />
                                        <Navigator.Screen name="WorkerAttendanceList" component={WorkerAttendanceList} options={{}} />
                                        <Navigator.Screen name="WorkerDetailRouter" component={WorkerDetailRouter} options={{}} />
                                        <Navigator.Screen name="WorkerProfile" component={WorkerProfile} options={{}} />
                                        <Navigator.Screen name="ContractingProjectDetailRouter" component={ContractingProjectDetailRouter} options={{}} />
                                        <Navigator.Screen name="ContractingProjectConstructionList" component={ContractingProjectConstructionList} options={{}} />
                                        <Navigator.Screen name="ContractingProjectDetail" component={ContractingProjectDetail} options={{}} />
                                        <Navigator.Screen name="SelectProjectType" component={SelectProjectType} options={{}} />
                                        <Navigator.Screen name="CreateProject" component={CreateProject} options={{}} />
                                        <Navigator.Screen name="EditProject" component={EditProject} options={{}} />
                                        <Navigator.Screen name="CreateContract" component={CreateContract} options={{}} />
                                        <Navigator.Screen name="EditContract" component={EditContract} options={{}} />
                                        <Navigator.Screen name="EditRequest" component={EditRequest} options={{}} />
                                        <Navigator.Screen name="CreateRequest" component={CreateRequest} options={{}} />
                                        <Navigator.Screen name="SelectSiteCreateOption" component={SelectSiteCreateOption} options={{}} />
                                        <Navigator.Screen
                                            name="TransactionListRouter"
                                            component={TransactionListRouter}
                                            options={{
                                                headerLeft: () => {
                                                    return <NavIcon colorStyle={BlueColor} navFunctionType={'admin_notification'} withBatch />
                                                },
                                                title: t('admin:TransactionList'),
                                            }}
                                        />
                                        <Navigator.Screen name="ContractingProjectList" component={ContractingProjectList} options={{}} />
                                        <Navigator.Screen
                                            name="ContractLogList"
                                            component={ContractLogList}
                                            options={{
                                                title: t('admin:ContractLog'),
                                            }}
                                        />
                                        <Navigator.Screen name="ConstructionList" component={ConstructionList} options={{}} />
                                        <Navigator.Screen name="RequestList" component={RequestList} options={{}} />
                                        <Navigator.Screen name="ReceiveList" component={ReceiveList} options={{}} />
                                        <Navigator.Screen name="OrderList" component={OrderList} options={{}} />
                                        <Navigator.Screen
                                            name="BillingInquiry"
                                            component={BillingInquiry}
                                            options={{
                                                title: t('admin:InquiriesAboutJoiningPaidPlan'),
                                            }}
                                        />
                                        <Navigator.Screen
                                            name="ProblemsInquiry"
                                            component={ProblemsInquiry}
                                            options={{
                                                title: t('admin:InquiriesAboutDefectsAndOperation'),
                                            }}
                                        />
                                        <Navigator.Screen name="CorecaAdminDashboard" component={CorecaAdminDashboard} options={{ title: t('common:CorecaAdminDashboard') }} />
                                    </>
                                )}
                                <>
                                    <Navigator.Screen
                                        name="SelectAccount"
                                        component={SelectAccount}
                                        options={{
                                            headerRight: undefined,
                                            title: t('common:SelectAccount'),
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="SelectDepartment"
                                        component={SelectDepartment}
                                        options={{
                                            headerRight: undefined,
                                            title: t('common:SwitchDepartment'),
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="SignInAccount"
                                        component={SignInAccount}
                                        options={{
                                            headerRight: undefined,
                                            title: t('common:LoginWithYourEmailAddress'),
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="SignUpAccount"
                                        component={SignUpAccount}
                                        options={{
                                            headerRight: undefined,
                                            title: t('common:CreateAccount'),
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AddInviteURL"
                                        component={AddInviteURL}
                                        options={{
                                            headerRight: undefined,
                                            title: t('common:CompanyInvitationUrl'),
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminHome"
                                        component={AdminHome}
                                        options={{
                                            headerLeft: () => {
                                                return <NavIcon colorStyle={BlueColor} navFunctionType={'admin_notification'} withBatch />
                                            },
                                            title: t('admin:SiteSchedule'),
                                        }}
                                    />

                                    <Navigator.Screen
                                        name="Launch"
                                        component={Launch}
                                        options={{
                                            headerShown: false,
                                            title: t('common:StartupScreen'),
                                        }}
                                    />

                                    <Navigator.Screen
                                        name="ResetPassword"
                                        component={ResetPassword}
                                        options={{
                                            headerRight: undefined,
                                            title: t('common:ResetPassword'),
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="CreateMyCompany"
                                        component={CreateMyCompany}
                                        options={{
                                            headerRight: undefined,
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="CreateOwnerWorker"
                                        component={CreateOwnerWorker}
                                        options={{
                                            headerRight: undefined,
                                            title: t('common:PersonalProfileRegisteration'),
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminChatListRouter"
                                        component={AdminChatListRouter}
                                        options={{
                                            title: 'チャット',
                                            headerLeft: () => null,
                                            headerRight: () => (
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <NavIcon colorStyle={BlueColor} navFunctionType={'update'} />
                                                    <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />
                                                </View>
                                            ),
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminChatDetail"
                                        component={AdminChatDetail}
                                        options={{
                                            headerRight: (props) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'admin_chat_settings'} />,
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminChatNoteList"
                                        component={AdminChatNoteList}
                                        options={{
                                            title: t('common:Notes'),
                                            headerRight: () => <NavIcon colorStyle={BlueColor} navFunctionType={'admin-addNote'} style={{ paddingTop: 6 }} />,
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminTodoListRouter"
                                        component={AdminTodoListRouter}
                                        options={{
                                            title: t('common:Todos'),
                                            headerRight: () => undefined,
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminAddNote"
                                        component={AdminAddNote}
                                        options={{
                                            title: t('common:NewNote'),
                                            headerRight: () => undefined,
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminChatSettings"
                                        component={AdminChatSettings}
                                        options={{
                                            title: t('admin:SettingsChat'),
                                            headerLeft: (props: any) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'back'} />,
                                            headerRight: () => <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />,
                                        }}
                                    />

                                    <Navigator.Screen
                                        name="AdminSelectOnetooneOrCustom"
                                        component={AdminSelectOnetooneOrCustom}
                                        options={{
                                            title: t('admin:SelectRoomType'),
                                            headerLeft: (props: any) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'back'} />,
                                            headerRight: () => <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />,
                                        }}
                                    />
                                    {/*
                                    <Navigator.Screen
                                        name="ChatRoleForCustomGroup"
                                        component={ChatRoleForCustomGroup}
                                        options={{
                                            title: t('admin:RoleCustomGroup'),
                                            headerLeft: (props: any) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'back'} />,
                                            headerRight: () => <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />,
                                        }}
                                    />
                                    */}
                                    <Navigator.Screen
                                        name="AdminSelectIndividual"
                                        component={AdminSelectIndividual}
                                        options={{
                                            title: t('admin:SelectIndividual'),
                                            headerLeft: (props: any) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'back'} />,
                                            headerRight: () => <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />,
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminSelectUsersForCustomGroup"
                                        component={AdminSelectUsersForCustomGroup}
                                        options={{
                                            title: t('admin:SelectChatMembers'),
                                            headerLeft: (props: any) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'back'} />,
                                            headerRight: () => <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />,
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminSelectUsersForPCCOC"
                                        component={AdminSelectUsersForPCCOC}
                                        options={{
                                            title: t('admin:SelectChatMembers'),
                                            headerLeft: (props: any) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'back'} />,
                                            headerRight: () => <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />,
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminEditGroupName"
                                        component={AdminEditGroupName}
                                        options={{
                                            title: t('admin:EditGroupName'),
                                            headerLeft: (props: any) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'back'} />,
                                            headerRight: () => <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />,
                                        }}
                                    />
                                    <Navigator.Screen
                                        name="AdminEditChatAdmin"
                                        component={AdminEditChatAdmin}
                                        options={{
                                            title: t('admin:EditChatAdmin'),
                                            headerLeft: (props: any) => <NavIcon {...props} colorStyle={BlueColor} navFunctionType={'back'} />,
                                            headerRight: () => <NavIcon colorStyle={BlueColor} navFunctionType={'admin_menu'} />,
                                        }}
                                    />
                                </>
                            </Navigator.Group>

                            {/* 現場サイド */}
                            <Navigator.Group
                                screenOptions={() => {
                                    return workerOption
                                }}>
                                <Navigator.Screen
                                    name="WSelectAccount"
                                    component={WSelectAccount}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:SelectAccount'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WSignUpAccount"
                                    component={WSignUpAccount}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:WorkerSignup'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WNotification"
                                    component={WNotification}
                                    options={{
                                        presentation: 'modal',
                                        cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                                        headerLeft: () => {
                                            return <NavIcon colorStyle={GreenColor} navFunctionType={'none'} />
                                        },
                                        headerRight: () => {
                                            return <NavIcon colorStyle={GreenColor} navFunctionType={'close'} />
                                        },
                                        title: t('common:Notice'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="CreateWorker"
                                    component={CreateWorker}
                                    options={{
                                        title: t('worker:RegisterYourPersonalProfile'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerHome"
                                    component={WorkerHome}
                                    options={{
                                        headerLeft: () => {
                                            return <NavIcon colorStyle={GreenColor} navFunctionType={'worker_notification'} withBatch />
                                        },
                                        title: t('worker:SiteSchedule'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="AttendancePopup"
                                    component={AttendancePopup}
                                    options={{
                                        headerShown: false,
                                        presentation: 'modal',
                                        title: t('common:AttendancePopup'),
                                        cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                                    }}
                                />
                                <Navigator.Screen name="MyAttendanceList" component={MyAttendanceList} options={{}} />
                                <Navigator.Screen
                                    name="MyPageRouter"
                                    component={MyPageRouter}
                                    options={{
                                        headerLeft: () => {
                                            return <NavIcon colorStyle={GreenColor} navFunctionType={'worker_notification'} withBatch />
                                        },
                                        title: t('worker:MyPage'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WEditComment"
                                    component={WEditComment}
                                    options={{
                                        title: t('worker:EditComment'),
                                    }}
                                />
                                <Navigator.Screen name="MyProfile" component={MyProfile} options={{}} />
                                <Navigator.Screen name="MySettings" component={MySettings} options={{}} />
                                <Navigator.Screen
                                    name="WEditEmail"
                                    component={WEditEmail}
                                    options={{
                                        title: t('worker:ChangeEmailAddress'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WEditName"
                                    component={WEditName}
                                    options={{
                                        title: t('worker:YourName'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WEditNickname"
                                    component={WEditNickname}
                                    options={{
                                        title: t('worker:YourNickname'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WEditPassword"
                                    component={WEditPassword}
                                    options={{
                                        title: t('worker:Password'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WEditPhoneNumber"
                                    component={WEditPhoneNumber}
                                    options={{
                                        title: t('worker:PhoneNumber'),
                                    }}
                                />
                                <Navigator.Screen name="WSiteDetail" component={WSiteDetail} options={{}} />
                                <Navigator.Screen
                                    name="WSiteRouter"
                                    component={WSiteRouter}
                                    options={{
                                        title: t('worker:SiteDetails'),
                                    }}
                                />
                                <Navigator.Screen name="WSiteWorkerList" component={WSiteWorkerList} options={{}} />
                                <Navigator.Screen
                                    name="WorkerChatListRouter"
                                    component={WorkerChatListRouter}
                                    options={{
                                        title: 'チャット',
                                        headerLeft: () => null,
                                        headerRight: () => (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <NavIcon colorStyle={GreenColor} navFunctionType={'update'} />
                                                <NavIcon colorStyle={GreenColor} navFunctionType={'worker_menu'} />
                                            </View>
                                        ),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerChatDetail"
                                    component={WorkerChatDetail}
                                    options={{
                                        headerRight: (props) => <NavIcon {...props} colorStyle={GreenColor} navFunctionType={'worker_chat_settings'} />,
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerChatNoteList"
                                    component={WorkerChatNoteList}
                                    options={{
                                        title: t('common:Notes'),
                                        headerRight: (props) => undefined,
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerTodoListRouter"
                                    component={WorkerTodoListRouter}
                                    options={{
                                        title: t('common:Todos'),
                                        headerRight: (props) => undefined,
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerAddNote"
                                    component={WorkerAddNote}
                                    options={{
                                        title: t('common:NewNote'),
                                        headerRight: () => undefined,
                                    }}
                                />

                                <Navigator.Screen
                                    name="WorkerChatSettings"
                                    component={WorkerChatSettings}
                                    options={{
                                        title: t('admin:SettingsChat'),
                                        headerLeft: (props: any) => <NavIcon {...props} colorStyle={GreenColor} navFunctionType={'back'} />,
                                        headerRight: () => <NavIcon colorStyle={GreenColor} navFunctionType={'worker_menu'} />,
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerSelectIndividual"
                                    component={WorkerSelectIndividual}
                                    options={{
                                        title: t('admin:SelectIndividual'),
                                        headerLeft: (props: any) => <NavIcon {...props} colorStyle={GreenColor} navFunctionType={'back'} />,
                                        headerRight: () => <NavIcon colorStyle={GreenColor} navFunctionType={'worker_menu'} />,
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerSelectUsersForCustomGroup"
                                    component={WorkerSelectUsersForCustomGroup}
                                    options={{
                                        title: t('admin:SelectChatMembers'),
                                        headerLeft: (props: any) => <NavIcon {...props} colorStyle={GreenColor} navFunctionType={'back'} />,
                                        headerRight: () => <NavIcon colorStyle={GreenColor} navFunctionType={'worker_menu'} />,
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerSelectUsersForPCCOC"
                                    component={WorkerSelectUsersForPCCOC}
                                    options={{
                                        title: t('admin:SelectChatMembers'),
                                        headerLeft: (props: any) => <NavIcon {...props} colorStyle={GreenColor} navFunctionType={'back'} />,
                                        headerRight: () => <NavIcon colorStyle={GreenColor} navFunctionType={'worker_menu'} />,
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerEditGroupName"
                                    component={WorkerEditGroupName}
                                    options={{
                                        title: t('admin:EditGroupName'),
                                        headerLeft: (props: any) => <NavIcon {...props} colorStyle={GreenColor} navFunctionType={'back'} />,
                                        headerRight: () => <NavIcon colorStyle={GreenColor} navFunctionType={'worker_menu'} />,
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerEditChatAdmin"
                                    component={WorkerEditChatAdmin}
                                    options={{
                                        title: t('admin:EditChatAdmin'),
                                        headerLeft: (props: any) => <NavIcon {...props} colorStyle={GreenColor} navFunctionType={'back'} />,
                                        headerRight: () => <NavIcon colorStyle={GreenColor} navFunctionType={'worker_menu'} />,
                                    }}
                                />
                                <Navigator.Screen
                                    name="WorkerSelectOnetooneOrCustom"
                                    component={WorkerSelectOnetooneOrCustom}
                                    options={{
                                        title: t('admin:SelectRoomType'),
                                        headerLeft: (props: any) => <NavIcon {...props} colorStyle={GreenColor} navFunctionType={'back'} />,
                                        headerRight: () => <NavIcon colorStyle={GreenColor} navFunctionType={'worker_menu'} />,
                                    }}
                                />
                                <Navigator.Screen
                                    name="AttendanceDetail"
                                    component={AttendanceDetail}
                                    options={{
                                        title: t('admin:AttendanceDetails'),
                                        ...(isAdmin ? adminOption : workerOption),
                                    }}
                                />
                            </Navigator.Group>
                            <Navigator.Screen
                                name="SelectMenu"
                                component={SelectMenu}
                                options={{
                                    headerShown: false,
                                }}
                            />
                            <Navigator.Screen
                                name="Licenses"
                                component={Licenses}
                                options={{
                                    headerShown: true,
                                    title: t('common:License'),
                                }}
                            />
                            <Navigator.Screen
                                name="LanguageSelector"
                                component={LanguageSelector}
                                options={{
                                    headerShown: true,
                                    title: t('common:LanguageSelector'),
                                }}
                            />
                        </>
                    ) : (
                        <>
                            {/* ログイン前に遷移可能な画面定義 */}
                            <Navigator.Group screenOptions={adminOption}>
                                <Navigator.Screen
                                    name="Launch"
                                    component={Launch}
                                    options={{
                                        headerShown: false,
                                        title: t('common:StartupScreen'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="SelectAccount"
                                    component={SelectAccount}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:SelectAccount'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="SignInAccount"
                                    component={SignInAccount}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:LoginWithYourEmailAddress'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="SignUpAccount"
                                    component={SignUpAccount}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:CreateAccount'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="AddInviteURL"
                                    component={AddInviteURL}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:CompanyInvitationUrl'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="ResetPassword"
                                    component={ResetPassword}
                                    options={{
                                        title: t('common:ResetPassword'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="CreateMyCompany"
                                    component={CreateMyCompany}
                                    options={{
                                        headerRight: undefined,
                                    }}
                                />
                                <Navigator.Screen
                                    name="CreateOwnerWorker"
                                    component={CreateOwnerWorker}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:PersonalProfileRegisteration'),
                                    }}
                                />
                            </Navigator.Group>
                            {/* 現場サイド */}
                            <Navigator.Group screenOptions={workerOption}>
                                <Navigator.Screen
                                    name="WSelectAccount"
                                    component={WSelectAccount}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:SelectAccount'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WSignUpAccount"
                                    component={WSignUpAccount}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:WorkerSignup'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="WAddInvitedURL"
                                    component={WAddInvitedURL}
                                    options={{
                                        headerRight: undefined,
                                        title: t('common:ForEmployees'),
                                    }}
                                />
                                <Navigator.Screen
                                    name="CreateWorker"
                                    component={CreateWorker}
                                    options={{
                                        title: t('common:RegisterPersonalProfile'),
                                    }}
                                />
                            </Navigator.Group>
                            <Navigator.Screen
                                name="Licenses"
                                component={Licenses}
                                options={{
                                    title: t('common:License'),
                                }}
                            />
                        </>
                    )}
                </Navigator.Navigator>
                <BottomSheet
                    style={{
                        bottom: 0,
                    }}
                />
                {loading != false && loading != 'inVisible' && (
                    <LoadingScreen
                        isUnTouchable={loading == 'unTouchable'}
                        loadingString={loadingString}
                        style={{
                            position: 'absolute',
                            zIndex: Platform.OS == 'ios' ? 1 : undefined,
                        }}
                    />
                )}
                {/* Androidで不具合起きるため */}
                {/* <StatusBar barStyle={'dark-content'} /> */}

                {toastMessage && <Toast toastMessage={toastMessage} style={{}} />}
                {afterSignIn == true && <CustomBottomTab isAfterSignIn={afterSignIn} isAdmin={isAdmin} />}
            </NavigationContainer>
        </>
    )
}

export default Router
