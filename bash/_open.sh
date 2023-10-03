# coreca-appにて、 bash ./bash/_open.shを実行することで、以下のパスのフォルダ内のファイルをすべて開きます。
# 広範囲にわたる改修などをした際に実行することで、問題を見つけるのに役立ちます。
# フォルダ直下のファイルは開こうとすると別ウィンドウが開くのでコメントアウトしています。手動で開いてください。
# もっと効率よく全てを開ける書き方があれば、書き換えて欲しいです。

# ターミナルから VS Code を起動できるようにするには、以下の方法で path を通す必要があります。
# VS Code を起動し、command + shift + p でコマンドパレットを開き、「shell command」と入力して Shell Command: Install 'code' command in PATH コマンドを検索して実行します。

code ./src/components/atoms/*

# code ./src/components/organisms/*
code ./src/components/organisms/arrangement/*
code ./src/components/organisms/attendance/*
code ./src/components/organisms/chat/*
code ./src/components/organisms/company/*
code ./src/components/organisms/construction/*
code ./src/components/organisms/contract/*
code ./src/components/organisms/date/*
code ./src/components/organisms/homeCalendar/*
code ./src/components/organisms/inputBox/*
code ./src/components/organisms/inquiry/*
code ./src/components/organisms/invoice/*
code ./src/components/organisms/invRequest/*
code ./src/components/organisms/invReservation/*
code ./src/components/organisms/notification/*
code ./src/components/organisms/invRequest/*
code ./src/components/organisms/request/*
code ./src/components/organisms/shadowBox/*
code ./src/components/organisms/site/*
code ./src/components/organisms/worker/*

code ./src/components/template/*

code ./src/fooks/*

# code ./src/localization/*
# code ./src/localization/ja/*
# code ./src/localization/en/*

# code ./src/models/*

code ./src/screens/adminSide/attendance/*
code ./src/screens/adminSide/chat/chatDetail/*
code ./src/screens/adminSide/chat/chatGroupMembers/*
code ./src/screens/adminSide/chat/chatList/*
code ./src/screens/adminSide/chat/chatNote/*
code ./src/screens/adminSide/chat/chatSettings/*
code ./src/screens/adminSide/chat/todoList/*
code ./src/screens/adminSide/company/addCompany/*
code ./src/screens/adminSide/company/companyDetail/*
code ./src/screens/adminSide/company/editCompany/*
# code ./src/screens/adminSide/company/*
code ./src/screens/adminSide/construction/addConstruction/*
code ./src/screens/adminSide/construction/constructionDetail/*
code ./src/screens/adminSide/construction/editConstruction/*
# code ./src/screens/adminSide/construction/*
code ./src/screens/adminSide/date/*
code ./src/screens/adminSide/department/*
code ./src/screens/adminSide/home/*
code ./src/screens/adminSide/inquiry/*
code ./src/screens/adminSide/invRequest/editInvRequest/*
code ./src/screens/adminSide/invRequest/invRequestDetail/*
code ./src/screens/adminSide/invReservation/addInvReservation/*
code ./src/screens/adminSide/invReservation/editInvReservation/*
code ./src/screens/adminSide/invReservation/invReservationDetail/*
code ./src/screens/adminSide/mypage/*
code ./src/screens/adminSide/site/addSite/*
code ./src/screens/adminSide/site/editSite/*
code ./src/screens/adminSide/site/siteDetail/*
code ./src/screens/adminSide/transaction/addTransaction/*
code ./src/screens/adminSide/transaction/contractingProjectDetail/*
code ./src/screens/adminSide/transaction/editTransaction/*
code ./src/screens/adminSide/transaction/invReservationDetail/*
# code ./src/screens/adminSide/transaction/*
code ./src/screens/adminSide/worker/addWorker/*
code ./src/screens/adminSide/worker/editWorker/*
code ./src/screens/adminSide/worker/workerDetail/*
# code ./src/screens/adminSide/*

code ./src/services/_others/*
code ./src/services/account/*
code ./src/services/arrangement/*
code ./src/services/asyncKVS/*
code ./src/services/attendance/*
code ./src/services/company/*
code ./src/services/construction/*
code ./src/services/contract/*
code ./src/services/contractLog/*
code ./src/services/date/*
code ./src/services/department/*
code ./src/services/firebase/*
code ./src/services/instruction/*
code ./src/services/invoice/*
code ./src/services/invRequest/*
code ./src/services/invReservation/*
code ./src/services/message/*
code ./src/services/note/*
code ./src/services/noteAttachment/*
code ./src/services/noteComment/*
code ./src/services/noteReaction/*
code ./src/services/notification/*
code ./src/services/partnership/*
code ./src/services/project/*
code ./src/services/reaction/*
code ./src/services/read/*
code ./src/services/request/*
code ./src/services/reservation/*
code ./src/services/room/*
code ./src/services/roomUser/*
# code ./src/services/SendGridMail/*
code ./src/services/SendGridMail/templates/*
code ./src/services/site/*
code ./src/services/ssg/*
code ./src/services/threadHead/*
code ./src/services/threadLog/*
code ./src/services/threadUser/*
code ./src/services/todo/*
code ./src/services/updateScreens/*
code ./src/services/worker/*

code ./src/stores/*

code ./src/usecases/account/*
code ./src/usecases/arrangement/*
code ./src/usecases/attendance/*
code ./src/usecases/chat/*
code ./src/usecases/company/*
code ./src/usecases/construction/*
code ./src/usecases/contract/*
code ./src/usecases/contractLog/*
code ./src/usecases/department/*
code ./src/usecases/home/*
code ./src/usecases/inquiry/*
code ./src/usecases/invRequest/*
code ./src/usecases/invReservation/*
code ./src/usecases/lock/*
code ./src/usecases/note/*
code ./src/usecases/notification/*
code ./src/usecases/permission/*
code ./src/usecases/planTicket/*
code ./src/usecases/project/*
code ./src/usecases/request/*
code ./src/usecases/reservation/*
code ./src/usecases/site/*
code ./src/usecases/ssg/*
code ./src/usecases/updateScreens/*
code ./src/usecases/worker/*
# code ./src/usecases/utils/*
# code ./src/usecases/utils/ext/*
# code ./src/usecases/*