/**
 *
 *  - 'is-mine' - 「あなた」
 *  - 'manager' - 「管理」：管理者以上
 *  - 'unregister' - 「未登録」：未登録の自社作業員

 *  ↓以下現場必要
 *  - 'is-site-manager' - 「現場責任者」
 *  - 'is-holiday' - 「休み」
 */
export type WorkerTagType = 'is-mine' | 'manager' | 'unregister' | 'left-business' | WorkerSiteTagType
export type WorkerSiteTagType = 'is-site-manager' | 'is-holiday'
