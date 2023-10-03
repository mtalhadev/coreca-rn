import { ConstructionRelationType } from '../construction/ConstructionRelationType'

/**
 * 現場と会社の関係
 * - 'manager' - 自社が工事の施工主の現場
 * - 'order-children' - 発注管理下。発注した工事（仲介工事）より下の全ての工事の現場。
 * - 'fake-company-manager' - 自社の関係仮会社が施工主の場合（自社が操作するため）
 * - 'other-company' - それ以外の現場
 * 
 * 以下の場合は請負発注した仲介工事なので現場が存在しない。
 * - 'owner' - 自社が案件の顧客（一番上の会社）
 * - 'intermediation' - 自社が仲介した工事
 */

export type SiteRelationType = ConstructionRelationType
