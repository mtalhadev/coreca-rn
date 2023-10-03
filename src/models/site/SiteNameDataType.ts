import { SiteCLType, SiteType, toSiteCLType } from './Site'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../construction/Construction'
import { ProjectCLType, ProjectType, toProjectCLType } from '../project/Project'
import { SiteListCLType, SiteListType, toSiteListCLType } from './SiteListType'

/**
 * @param siteNumber - （>= 1）初日は1。
 */
export type SiteNameDataType = {
    siteNumber?: number
    targetSite?: SiteType
    sites?: SiteListType
    construction?: ConstructionType
    project?: ProjectType
    name?: string
}

export type SiteNameDataCLType = SiteNameDataType & {
    targetSite?: SiteCLType
    sites?: SiteListCLType
    construction?: ConstructionCLType
    project?: ProjectCLType
}

export const toSiteNameDataClient = (data?: SiteNameDataType): SiteNameDataCLType => {
    return {
        ...data,
        targetSite: data?.targetSite ? toSiteCLType(data?.targetSite) : undefined,
        sites: data?.sites ? toSiteListCLType(data?.sites) : undefined,
        construction: data?.construction ? toConstructionCLType(data?.construction) : undefined,
        project: data?.project ? toProjectCLType(data?.project) : undefined,
    } as SiteNameDataCLType
}
