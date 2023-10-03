import { __getEmulatorFunctionsURI, _callFunctions } from "../../src/services/firebase/FunctionsService"
import { GetWorkerParam } from "../../src/services/worker/WorkerService"
import mockAxios from "../mockAxios"

export const _getWorker = (params: GetWorkerParam) => {
    
    const Url = __getEmulatorFunctionsURI('IWorker-getWorker')
    
    mockAxios
    .onPost(Url, params)
    .reply(200, {
        "success": {
            "companyId": "company-id",
            "workerId": params.workerId,
            "companyRole": "general",
            "createdAt": 1658318825620,
            "imageColorHue": 143,
            "offDaysOfWeek": [
                "月",
                "火",
                "水",
                "木",
                "金",
                "土",
                "日",
                "祝"
            ],
            "name": "ABC",
            "leftDate": 1664435181099,
            "updatedAt": 1664448126000,
            "account": {
                "accountId": "account-id",
                "workerId": params.workerId,
                "password": "Hida0315",
                "email": "abc@gmail.com",
                "token": "ExponentPushToken[2H09xTNKcJDXFbWp0nlPct]",
                "createdAt": 1660734818459,
                "updatedAt": 1660734819191
            },
            "departments": null
        }
    })
}
