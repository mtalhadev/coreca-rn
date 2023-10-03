/**
 * 工事と会社の関係
 * - 'owner' - 案件の顧客（一番上の会社）
 * - 'manager' - 工事の施工主
 * - 'intermediation' - 請負発注した仲介工事。ownerとintermediationでorder（発注工事）と表現することも多い。仲介工事の下に発注管理下工事がある。
 * - 'order-children' - 発注管理下工事。発注した工事（仲介工事）より下の全ての工事。
 * - 'fake-company-manager' - 仮会社が施工主の場合（自社が操作するため）
 * - 'other-company' - それ以外の工事
 */
export type ConstructionRelationType = 'owner' | 'manager' | 'intermediation' | 'order-children' | 'fake-company-manager' | 'other-company'
