import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';
import { TotalSeconds } from '../_others/TotalSeconds';
import { ID } from '../_others/ID';
import { SiteAttendanceDataType } from '../attendance/SiteAttendanceDataType';
import { SiteType } from '../site/Site';
import { InvRequestType } from '../invRequest/InvRequestType';

/**
 * 現場の勤怠データを保存。SSG用
 */
export type SiteAttendanceModel = Partial<{
    siteAttendanceId: ID;
    date: TotalSeconds;
    companyId: ID;
    siteId: ID;
    siteAttendanceData?: SiteAttendanceDataType;
    site?: SiteType;
    invRequest?: InvRequestType;
}> & CommonModel;

export const initSiteAttendance = (siteAttendance: Create<SiteAttendanceModel> | Update<SiteAttendanceModel>): Update<SiteAttendanceModel> => {
    const newSiteAttendance: Update<SiteAttendanceModel> = {
        siteAttendanceId: siteAttendance.siteAttendanceId,
        date: siteAttendance.date,
        companyId: siteAttendance.companyId,
        siteId: siteAttendance.siteId,
        siteAttendanceData: siteAttendance.siteAttendanceData,
        site: siteAttendance.site,
        invRequest: siteAttendance.invRequest,
    };
    return newSiteAttendance;
};

/**
 * {@link SiteAttendanceOptionParam - 説明}
 */
export type SiteAttendanceOptionInputParam = ReplaceAnd<
    GetOptionObjectType<SiteAttendanceOptionParam>,
    {
        // 
    }
>;

export type GetSiteAttendanceOptionParam = GetOptionParam<SiteAttendanceType, SiteAttendanceOptionParam, SiteAttendanceOptionInputParam>;

/**
 * 
 */
export type SiteAttendanceOptionParam = {
    // 
};

export type SiteAttendanceType = SiteAttendanceModel & SiteAttendanceOptionParam;