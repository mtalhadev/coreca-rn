### 事前準備（必須）

1. coreca-app/**tests**/utils/seed/firestore-export-import/で npm install を実行
2. coreca-app/**tests**/utils/seed/firestore-export-import/node_modules/内の全ファイルを coreca-app/**tests**/utils/seed/lib/firestore-export-import/node_modules/へコピー
3. coreca-app/**tests**/utils/seed/で npm install を実行

### seed シードの利用説明・注意事項

1. まず Firebase エミュレータを起動する

```bash
// project IDはseed側と合わせること（/Users/moderntique/coreca-app/__tests__/utils/seed/.env内に設定箇所あり）、まず以下のコマンドそのままに実行することを推奨
// バイナリのフルデータは斉藤さん提供（authと案件3,000件分のテストデータ入り）
firebase --project='demo-emulator-project' emulators:start --import=バイナリのフルデータのパス
```

2.  seed コマンドの使い方

```bash
// 大前提として、Firebaseエミュレータが起動していること

// seedをVSCodeのMPMスクリプトで実行する場合:
左下ペインのseed-importをクリック   // coreca-app/__tests__/utils/seed/data.jsonのデータをFirestoreエミュレータへインポートする
左下ペインのseed-export           // Firestoreエミュレータからcoreca-app/__tests__/utils/seed/data.jsonへデータがエクスポートされる

// seedのヘルプ表示（カレントディレクトリはcoreca-app/__tests__/utils/seed/）
node ./lib/seed -h

// seedをnodeのコマンドラインで実行する場合の例：
node ./lib/seed to data.json
node ./lib/seed from data.json
```

3. seed は、Firebase エミュレータを起動したままの状態で何度でも実行することができる
4. data.json には、斉藤さんに作成いただいたフルのテストデータ（案件 3,000 件）が入っているが、これを加工して特定のエンティティだけをインポートすることができる（JSON データフォーマットは後述）
5. data.json は現在のものをオリジナルとして、データを加工して使ってもらっても構わない（後述する batchupdate コマンドも用意）
6. 今後の単体テストに向けて、テストパターン化された様々な json ファイルが用意される予定
7. seed のインポートは、 Firestore エミュレータ 内の同一 documentId を上書きする
8. seed 実行時に warning が 3 点表示されるが、これらは利用パッケージから出力されるものでは抑制できないためご容赦（.npmrc や npm run --silent でも消せない）
9. seed が利用している firestore-backup-restore パッケージは、BulkWrite 化のためにソースを相当書き換えており Github にあるものでは動作しないので注意
10. .vscode/setting.json に linter/prettier の保存時実行の設定があるので、必要な方は以下をご参照

```bash
{
    "[typescript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "eslint.alwaysShowStatus": true
}
```

### 注意事項（エミュレータ環境と本番環境の違い）

1. トランザクション

-   1 つのドキュメントに対して複数の書き込みが同時に実行される機能をテストする場合、エミュレータでは書き込みリクエストが完了するまで時間がかかることがあり、場合によってはロックが解除されるまでに最長で 30 秒かかる。よって、エミュレータ環境では必要に応じてタイムアウト値を調整する必要あり。

2. インデックス

-   エミュレータ環境では複合インデックスの有無は無視され、有効なクエリであればそのまま実行される。

3. 甘い制限

-   本番環境に存在する様々な制限は、エミュレータ環境ですべて再現されるわけではない。

4. メモリ

-   Firebase エミュレータは相当なメモリを消費するので注意
-   メモリがタイトな状況で seed を実行すると激重になるので要注意（通常なら、import/export 共に 5 秒以内で完了する）

### seed データ作成者の作成手順（斉藤さん向け）：

1. coreca-app 上で充実した新規データを作成
2. seed の export 機能ですべてのエンティティを JSON 出力（エンティティ指定、ないし全エンティティ一括の 2 パターンで出力可能）
3. auth:export コマンドで auth データを JSON 出力し、必要な管理者 10 件を除いて JSON から削除
4. 3 項の JSON から UID を抜き出し、Account エンティティの documentId と accountId へ設定（これは管理者 10 件分だけの作業、それ以外のアカウントは auth と紐づかなくて良く、適当なユニーク値の documentId と accountId であれば良い）
5. エンティティ別ファイル化やデータの加工、テスト要件に応じたボリュームやパターンの JSON 作成など、必要な作業を実施
6. すべてできたら、seed の import を実行して確認（＊実行前に必ず Firesotre の全データバックアップを実施のこと）

### seed データフォーマット

```json
{
    "コレクション名": {
        "ドキュメントid値": {
            "ドキュメントidフィールド名": "ドキュメントid値",
            "フィールド名（数値型）": 数値,
            "フィールド名（string型）": "文字列値",
            "フィールド名（bool型）": trueないしfalse,
            "フィールド名（参照型）": "参照型値",
            "フィールド名（Object型）": {
                "Objectのフィールド名（数値型）": 数値,
                "フィールド名（string型）": "文字列値"
            },
            // Date型の値表現は以下2つのどちらでも可
            "フィールド名（Date/Time型）": Date型の値,
            "フィールド名（Date/Time型）": {   // Timestamp型の値の場合
                "seconds": seconds値,
                "nanoseconds": nanoseconds値
            },
            "フィールド名（階層Objectの親）": {
                "フィールド名（数値型）": 数値,
                "フィールド名（string型）": "文字列値",
                "フィールド名（階層Objectの子）": {
                    "フィールド名（数値型）": 数値,
                    "フィールド名（string型）": "文字列値",
                    "フィールド名（階層Objectの孫）": {
                        "フィールド名（数値型）": 数値,
                        "フィールド名（string型）": "文字列値"
                    }
                }
            },
            "フィールド名（（数値型配列）": [数値, 数値, 数値],
            "フィールド名（string型配列）": ["文字列値", "文字列値", "文字列値"],
            "フィールド名（Date/Time型配列）": [Date型の値, Date型の値, Date型の値],
            "Geoロケーションフィールド名": {
                "coords": {
                    "latitude": number型の値,
                    "longitude": number型の値,
                    "altitude": number型の値 | null,
                    "accuracy": number型の値 | null,
                    "altitudeAccuracy": number型の値 | null,
                    "heading": number型の値 | null,
                    "speed": number型の値 | null
                },
                "timestamp": Date型の値（number型なのでDate型と思われるが、確認必要）
            },
            "サブコレクション名": {
                "ドキュメントid値": {
                    "ドキュメントidフィールド名": "ドキュメントid値",
                    "フィールド名（数値型）": 数値,
                    "フィールド名（string型）": "文字列値"
                },
                "ドキュメントid値": {
                    ...,
                    ...,
                    ...
                }
            }
        },
        "ドキュメントid値": {
            ...,
            ...,
            ...
        }
    },
}

// AccountエンティティのみauthのUIDをドキュメントIdならびにaccountIdフィールドにセットする必要があるため、以下のフォーマットとする
{
    "Account": {
        "1から始まる連番（ユニーク値）": {
            "accountId": "",
            "email": "メールアドレス値",
            "password": "パスワード値",
            "workId": "Workerのドキュメントid値",
        },
        ...,
        ...,
        ...
    }
}
```

### batchupdate データ加工コマンドの利用説明・注意事項

1. batchupdate は、 data.json に対する Worker の退会日と案件の工期にバッチ変更に対応

2. batchupdate コマンドの使い方

```bash
// batchupdateをVSCodeのMPMスクリプトで実行する場合:
左下ペインのbatchUpdate-project-periodをクリック   // coreca-app/__tests__/utils/seed/data.jsonのデータに対して、全案件の工期開始日を現在日、終了日を2ヶ月先に変更）
左下ペインのbatchUpdate-worker-leftをクリック      // coreca-app/__tests__/utils/seed/data.jsonのデータに対して、全作業員の退会日を現在日から1ヶ月前に変更）

// batchupdateのヘルプ表示（カレントディレクトリはcoreca-app/__tests__/utils/seed/）
node ./lib/batchupdate -h

// batchupdateをnodeのコマンドラインで実行する場合の例：
node ./lib/batchupdate projectperiod ./data.json 1 2    // data.jsonの全ての案件について、工期を現在日からの月数で指定（開始日、終了日）
node ./lib/batchupdate workerleft ./data.json 1        // data.jsonの全ての作業員について、退会日を現在日からの月数で指定
```

3. batchupdate を VSCode の MPM スクリプトで実行する場合の月数規定値は、coreca-app/**tests**/utils/seed/.env ファイルで変更可能
4. ヘルプ（-h）には月数指定のマイナス値も指定可能とありますが、実際にはマイナス値はコマンドラインからは受け付けられません（コマンドラインのオプションと認識されるため）
5. コマンドラインでの月数指定のマイナス値については、今後対応予定です

### LoggerService の利用説明・注意事項

1. Node.js 版

-   seed のソース内でパフォーマンスログを使用しているので、これを参照

2. React Nativre 版

-   こちらはまだ利用しないでください（奥田が 7 月からリファクタリングで使用したうえで README 提示いたします）
-   依存パッケージは react-native-logs 1 つだけ（coreca-app の package.json には未記述）
-   LoggerServiceNative は、事前に Console を有効にするコマンド実行が必要（あくまで Debug 時に利用するもの）
