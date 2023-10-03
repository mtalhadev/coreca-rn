## Expoマネージワークフローから開発ビルドへの移行（ SDK46版）

＊本READMEの内容は頻繁に変わるため、以下の更新日付を確認するようにしてください。

### 更新日：2022.09.16
---
### 背景
現状のアプリが非常に重いため、これを可能な限り改善させるための措置を講じる要がある

### 改善が必要なポイント
1. アプリ全体におけるメモリ消費の低減
2. データアクセスにおけるCPU負荷とメモリ消費の低減
3. データ整形におけるCPU負荷の低減
4. GUIにおけるCPU負荷の低減

### 改善策

上記のうち、本READMEでは1項と2項をターゲットとして開発ビルドへの移行、Hermesの導入、RNFirebaseの導入を行う上での移行手順をドキュメント化する（＊3, 4項についても後述）。
#
### Expoマネージワークフロー

現在までのcoreca-appの開発は、Expoマネージワークフローという最もイージーなRectNativeアプリの開発手法を採用している。

#### ■ メリット

Expoマネージワークフローでは、ネイティブ実装の知識を有せずともJSの知識だけでスマホアプリが開発でき、かつ、Expo Goというこれまたイージーにシミュレータや実機でのアプリ検証やデバッグを可能にするランタイム環境を活用することができる。

#### ■ デメリット

外部パッケージを含む全てがJSであり、それら全ての実行もJS実行エンジン上で行われる。よって、パフォーマンスイシューをしっかり意識して機能実装、検証、チューニングのサイクルを個々の機能実装で行っていかないと、気づいたときにはとんでもなく重いアプリになってしまう。

- これはExpo GoというよりReact Nativeというクロス開発環境が持つ宿命でもある
- クロス開発環境とネイティブ開発環境では、実装したアプリのパフォーマンスに数倍から10倍近くの差が生まれる（もちろんクロス開発環境が低の側）

＊一方、ネイティブ開発環境ではネイティブの技術を求められるだけでなく、iOSとAndroid双方のアプリを各々開発実装する必要がある

#### ■ クロス開発環境で開発する上での意識付け

- とにかくパフォーマンスイシューをしっかり意識し、機能実装・検証・チューニングのサイクルを個々の機能実装単位で行うことが重要（＊実装しっぱなしではなく、パフォーマンスログを残して担保すことが重要）
- DBから取得するデータの体裁（フォーマット）＝UIで表示するままの体裁、これに近ければ近いほど端末アプリ側のGUIパフォーマンスは改善される。端末アプリ側でデータ整形のためにlodashでぐるぐる、といった処理は、あちらこちらでCPUの過負荷を生み出し、結果としてアプリ全体のレスポンスが低下するのみならず、メモリ消費も増加する
- 自身が実装したScreenでは、React Nativeのリレンダリグサイクルを必ず確認してログ出力し、無用なリレンダリングや無用なフェッチが走っていないことを担保する

＊他、パフォーマンスに関わるであろう部分への意識がクロス開発環境では常に求められる
#
### Expo開発ビルド（expo-dev-client）

開発ビルドは、Expoが数年前から用意しているマネージワークフローとベアワークフローの中間に位置するワークフロー。

#### ■ メリット

- マネージワークフローでは利用できなかったネイティブモジュールが利用でき、パフォーマンスの改善に役立つ（今回、Firebase JS SDKに代わりネイティブ実装のReactNative Firebase SDKを採用）
- Hermes（Android／iOS共通のJS実行エンジン）が利用でき、これ自体がメモリ消費対策となる（特にAndroidで効果が顕著との報告あり、若干だがパフォーマンスにも貢献）
- 開発実装自体は、マネージワークフロー同様にJSのみで行うことができる
- Hermes導入により、Android／iOS間のJS仕様の差異が低減される可能性がある（同一実行エンジンとなるため）

#### ■ デメリット（と言うほどではないが）

- ビルドのプロセスが発生する（ただし、1度ビルドしてしまえばJSのみの実装・改修ならリビルド不要） 
- ExpoGoが使えない（ただし、シミュレータへのDnDでアプリ配備OK＋JSコード変更保存でホットリロードなので慣れだけの問題）
- 個々の開発者が実機検証を行うことはできない（開発では原則シミュレータ上での稼働検証となり、実機検証はテスターのタスクとなる）

#### ■ 開発ビルドへの移行ハードル

- Expo SDK46への移行（9/16 すでに移行済み）
- パッケージアップグレード（9/16 すでにアップグレード済み）
- SDK45やパッケージアップグレードをcoreca-appに適用することにより発生するであろうビルドエラーへの対応（9/16 すでに解消）
- Hermes導入に伴い、アプリ側の改修が必要になる可能性あり（JCS／V8とHermes間の相違に伴う）
- 開発ビルド環境構築が若干厄介（＊これを低減するために本READMEを作成したと言っても良い）
#
### 開発ビルドへの移行手順

今回、単純に開発ビルドを導入するだけに留まらずExpo SDK46、パッケージアップグレード、Hermes、 ReactNative Firebaseも併せて導入するが、基本的にfeature/functionizeブランチのpackage.jsonがが解決してくれる。

#### ■ 基本的な手順

0. 以下の作業は、当面feature/functionizeブランチからチェックアウトしたブランチで行うこと
1. Expoのコマンドラインツール更新とデバイス登録
2. パッケージアップグレードの実施
3. XCodeの確認と設定
4. 開発ビルド環境整備と正常ビルドを確認

#### 1. Expoのコマンドラインツール更新とデバイス登録
1. npm install -g expo-cliを実行（常に耐震に保つこと）
2. npm install -g eas-cliを実行（常に耐震に保つこと）
3. eas device:createを実行（これは1回だけ実行すれば良く、開発ビルドを実機で稼働させるために必要）

#### 2. パッケージアップグレード
1. 以前のバージョンのnode_modulesがある場合はまず削除
2. yarn installを実行
3. expo doctor --fix-dependencies実行

#### 3. XCodeの確認と設定

1. XCodeが最新であることを確認
2. XCodeのPreferenceを開き、Accountsタブで自分のApple IDが設定され、かつTeamにも自分が追加されていることを確認する
3. expo runやprebuildする人は以下も確認（＊開発ビルドでは基本不要、トラブった時や端末向けビルドの時くらい）
- XCodeでプロジェクトのiosディレクトリにあるtestkvs2.xcodeprojを開き、Signing & Capabilities > Signing(Debug)にあるTeamを選択する

＊expo runやprebuildコマンドはiosとandroidディレクトリを生成してネイティブコードが出力されるが、通常これらは必要ないし、これらディレクトリ中のファイルを変更することも厳禁

＊ビルド時に以下のエラーに遭遇した場合にのみ、上記を試す価値あり

error Failed to build iOS project. We ran "xcodebuild" command but it exited with error code 65.

＊expo runやprebuildはネイティブのファイル構成の勉強にはなるが、質問にはお答えできないのでご容赦(試す場合は自己責任でお願い)

#### 4. 開発ビルド環境整備と正常ビルドを確認

■ ビルド実行

以下のコマンドでローカルビルドを実行

eas build --profile development --local

＊ビルド完了直前あたりに自動的にTerminalのウインドウが1つ開いでMetroの画面が表示されるが、このTerminalウインドウは随時閉じて良い

＊基本、ローカルでもクラウドのEASでも一緒だが、クラウドのEASはパイプラインが1つなので特段の理由がない限りローカルのeasを使用すること。

#### ビルド成功した後の手順

1. ビルドが成功すると、iOSの場合は.tar.gzファイルが生成されるのでこれを解凍して.appファイルを得る（Androidの場合は.apkファイルが生成される）
2. この.appファイルをiOSシミュレータにDnDしてタップすでにDnD済みの.appがある場合、右クリックでアプリ削除した後にDnDすることでキャッシュも削除できる）
3. Androidの場合も同様、.apkファイルをAndroidエミュレータにDnDしてタップすでにDnD済みの.apkがある場合、右クリックでアプリ削除した後にDnDすることでキャッシュも削除できる）
4. ターミナルでexpo startを実行
5. 後は、シミュレータの画面でアプリをタップし、Expoの画面が表示されたら緑丸のついたCORECA on …..をタップすればアプリが起動する
6. 起動後、アプリのソースを変更して保存するたびにホットリロードされることを確認する

#### 5. 開発ビルド版Coreca-appの正常稼働を確認
- アプリを操作して正常稼働することを確認する
 

## 以上、これ以降の開発は「開発ビルド＋Hermes有効＋ReactNative Firebase」でFIX。
#
### トラブルシューティング

#### yarn利用時のpackage-lock.json

1. プロジェクト内でpackage-lock.jsonとyarn.lockと共存させない（想定外のバージョンにロックされないように）
2. グローバルへのパッケージインストールでは、yarnではなくnpmを使った方が無難（スタンダードはあくまでnpm）

#### ビルド中に遭遇する可能性のある赤色警告やエラーへの対処

1. 以下はSDK46で新たに出現したバージョン非互換であり、SDK46はReact18なのでアップグレードした方が良さそう
```sh
- [INSTALL_DEPENDENCIES] warning " > @react-native-picker/picker@2.4.2" has incorrect peer dependency "react@16 || 17".
```

2. 以下もSDK46で新たに出現したバージョン非互換であり、Expoのパッケージなのに非互換の謎で対処のしようがない（実行時に問題がなければスルー）
```sh
[INSTALL_DEPENDENCIES] warning "expo-splash-screen > @expo/prebuild-config@5.0.3" has unmet peer dependency "expo-modules-autolinking@>=0.8.1".
```

3. 以下はSDK45でも出ていた警告で、互換性のあるバージョンに合わせられないため実行時に問題がなければスルー
```sh
[INSTALL_DEPENDENCIES] warning " > lottie-react-native@5.1.3" has unmet peer dependency "lottie-ios@^3.2.3".
```

4. 以下もSDK45でも出ていた警告で、互換性のあるバージョンにバージョンを合わせられないため実行時に問題がなければスルー
```sh
[INSTALL_DEPENDENCIES] warning "react-native > react-native-codegen > jscodeshift@0.13.1" has unmet peer dependency "@babel/preset-env@^7.1.6".
```

5. 以下はSDK46で新たに出現したバージョン非互換であり、SDK46はReact18なので出ている（devDependenciesのパッケージであり、追って必要ならばアップグレード、開発で支障なければスルー）
```sh
[INSTALL_DEPENDENCIES] warning " > react-test-renderer@17.0.2" has incorrect peer dependency "react@17.0.2".
```

6. 以下もSDK46で新たに出現した警告だが、パッチファイルがないと言っているだけなので無視して可
```sh
[INSTALL_DEPENDENCIES] $ patch-package
[INSTALL_DEPENDENCIES] patch-package 6.4.7
[INSTALL_DEPENDENCIES] Applying patches...
[INSTALL_DEPENDENCIES] No patch files found
```

7. 以下は無視して可
```sh
[INSTALL_DEPENDENCIES] $ husky install
[INSTALL_DEPENDENCIES] fatal: Not a git repository (or any of the parent directories): .git
```

8. 以下はSDK44,45でも出ていた警告で、npm install -g sharp-cliしても解消しなければ無視して可
```sh
[PREBUILD] Using node to generate images. This is much slower than using native packages.
[PREBUILD] › Optionally you can stop the process and try again after successfully running `npm install -g sharp-cli`.
```

9. 以下もSDK45でも出ていた警告で、Rubyスクリプトが非推奨引数で関数呼び出ししているよう（実行時に問題が出なければスルー）
```sh
[INSTALL_PODS] /private/var/folders/51/kbnfldn902jg5v5ntcgc29lm0000gn/T/eas-build-local-nodejs/5c8eae4e-4994-418d-a1aa-0511c6ac8aec/build/node_modules/react-native/scripts/react_native_pods_utils/script_phases.rb:51: warning: Passing safe_level with the 2nd argument of ERB.new is deprecated. Do not use it, and specify other arguments as keyword arguments.
[INSTALL_PODS] /private/var/folders/51/kbnfldn902jg5v5ntcgc29lm0000gn/T/eas-build-local-nodejs/5c8eae4e-4994-418d-a1aa-0511c6ac8aec/build/node_modules/react-native/scripts/react_native_pods_utils/script_phases.rb:51: warning: Passing trim_mode with the 3rd argument of ERB.new is deprecated. Use keyword argument like ERB.new(str, trim_mode: ...) instead.
```

10. 以下はWatch OSサポートなので無視して可
```sh
[RUN_FASTLANE] 2022-09-15 09:55:30.800 xcodebuild[56261:26727647] Requested but did not find extension point with identifier Xcode.IDEKit.ExtensionSentinelHostApplications for extension Xcode.DebuggerFoundation.AppExtensionHosts.watchOS of plug-in com.apple.dt.IDEWatchSupportCore
[RUN_FASTLANE] 2022-09-15 09:55:30.800 xcodebuild[56261:26727647] Requested but did not find extension point with identifier Xcode.IDEKit.ExtensionPointIdentifierToBundleIdentifier for extension Xcode.DebuggerFoundation.AppExtensionToBundleIdentifierMap.watchOS of plug-in com.apple.dt.IDEWatchSupportCore
[RUN_FASTLANE] Command timed out after 3 seconds on try 1 of 4, trying again with a 6 second timeout...
[RUN_FASTLANE] 2022-09-15 09:55:33.812 xcodebuild[56272:26727803] Requested but did not find extension point with identifier Xcode.IDEKit.ExtensionSentinelHostApplications for extension Xcode.DebuggerFoundation.AppExtensionHosts.watchOS of plug-in com.apple.dt.IDEWatchSupportCore
[RUN_FASTLANE] 2022-09-15 09:55:33.812 xcodebuild[56272:26727803] Requested but did not find extension point with identifier Xcode.IDEKit.ExtensionPointIdentifierToBundleIdentifier for extension Xcode.DebuggerFoundation.AppExtensionToBundleIdentifierMap.watchOS of plug-in com.apple.dt.IDEWatchSupportCore
```

11. 以下はSDK44, 45でも出ていた警告で、Reanimatedとhermes-engineのC++ライブラリバージョンが異なることにより警告されているが、可能な範囲でReanimatedのバージョンを上げても下げても解消しないため、実行時に問題がなければスルー
```sh
[INSTALL_PODS] [!] Can't merge user_target_xcconfig for pod targets: ["Reanimated", "hermes-engine"]. Singular build setting CLANG_CXX_LIBRARY has different values.
```

12. 以下はconfig-pluginsが古いと発生する可能性のある警告（放置せずに指定bバージョンにアップグレードすること）
```sh
Expected package @expo/config-plugins@^x.x.x
```

#### アプリ実行時に遭遇する可能性のある警告やエラーへの対処(主だったもののみ)

1. 以下はimportの循環参照の警告であり、循環参照自体は問題ないが出来ればしない方が良い
```sh
Require cycles are allowed, but can result in uninitialized values. Consider refactoring to remove the need for a cycle.

```

2. 以下はCustomResponse.successがundefinedであった場合にその参照で出ているが、ロジックに問題なければ無視して可
```sh
[Unhandled promise rejection: TypeError: undefined is not an object (evaluating '_result$success.constructions[(0, _CustomDate.monthBaseText)(selectedMonth)]')]
at src/screens/adminSide/transaction/contractingProjectDetail/ContractingProjectConstructionList.tsx:257:64 in <anonymous>
```

3. 以下は古いリスナー登録と削除メソッド使用での警告＞でこれはかなりの数が出力されるが、最新のcoreca-appで対処済みとのことでもう出ないはず
```sh
EventEmitter.removeListener('appStateDidChange', ...): Method has been deprecated. Please instead use `remove()` on the subscription returned by `EventEmitter.addListener`.

```

4. 以下はzIndex 10が無効な値で警告されているが、Screenのオーバーレイ表示で問題なければ無視して可
```sh
zIndex was given a value of 10, this has no effect on headerStyle.
```

5. 以下はLogBox.ignoreLogsでされているので無視して可（React Nativeの公式トラシュー）
```sh
Non-serializable values were found in the navigation state. Check:
```

## 自身が実装したコードのパフォーマンス担保手段

これは別途まとめて共有予定（無用なリレンダリングやフェッチを改修した際のスナップショットあり）。

＊__DEV__付きのConsole.logやLoggerServiceNativeコードを残すことは、他の開発者やテスターに対して自身が実装したコードのパフォーマンスを示す担保となり、かつ、実行フロー（特にフックの依存配列の正当性）把握を助ける有効なコメントとしても機能する。
