import mockAxios from '../../../__mocks__/mockAxios'
import { _createConstruction, _getConstruction } from '../../../__mocks__/services/ConstructionService'
import { _getContract } from '../../../__mocks__/services/ContractService'
import { _createProject, _deleteProject, _getProject, _updateProject } from '../../../__mocks__/services/ProjectService'
import { newCustomDate } from '../../../src/models/_others/CustomDate'
import { ProjectModel } from '../../../src/models/project/Project'
import { __getEmulatorFunctionsURI } from '../../../src/services/firebase/FunctionsService'
import { deleteTargetProject, getContractingProjectDetail, getTargetProject } from '../../../src/usecases/project/CommonProjectCase'

afterEach(() => {
    mockAxios.reset()
    mockAxios.resetHistory()
})

const getProjectUrl = __getEmulatorFunctionsURI('IProject-getProject')
const updateProjectUrl = __getEmulatorFunctionsURI('IProject-updateProject')
const createProjectUrl = __getEmulatorFunctionsURI('IProject-createProject')
const getContractUrl = __getEmulatorFunctionsURI('IContract-getContract')
const deleteProjectUrl = __getEmulatorFunctionsURI('IProject-deleteProject')

describe('getTargetProject case', () => {
    it('myProjectId = undefined test', async () => {
        const res = await getTargetProject({ projectId: undefined })
        expect(res.error).toEqual('idが足りません。')
    })

    it('success test', async () => {
        _getProject({ projectId: 'project-id' })

        const res = await getTargetProject({ projectId: 'project-id' })
        console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(getProjectUrl)
        expect(res.success?.projectId).toEqual('project-id')
    })

    it('error test', async () => {
        const getProjectUrl = __getEmulatorFunctionsURI('IProject-getProject')

        mockAxios.onPost(getProjectUrl).networkError()

        const res = await getTargetProject({ projectId: 'project-id' })

        expect(mockAxios.history.post[0].url).toEqual(getProjectUrl)
        expect(res.error).toEqual('Network Error')
    })
})

describe('getContractingProjectDetail case', () => {
    it('contractId = undefined test', async () => {
        const res = await getContractingProjectDetail({ contractId: undefined, myCompanyId: 'my-company-id' })
        expect(res.error).toEqual('idが足りません。')
    })

    it('success test', async () => {
        _getContract({
            contractId: 'contract-id',
            options: {
                project: {
                    createCompany: true,
                    updateWorker: {
                        company: true,
                    },
                },
                orderCompany: {
                    companyPartnership: {
                        params: {
                            companyId: 'my-company-id',
                        },
                    },
                },
                receiveCompany: {
                    companyPartnership: {
                        params: {
                            companyId: 'my-company-id',
                        },
                    },
                },
                orderDepartments: true,
                receiveDepartments: true,
                contractLog: true,
            },
        })
        const res = await getContractingProjectDetail({ contractId: 'contract-id', myCompanyId: 'my-company-id' })
        console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(getContractUrl)
        expect(res.success?.projectId).toEqual('project-id')
    })

    it('error test', async () => {
        mockAxios.onPost(getContractUrl).networkError()

        const res = await getContractingProjectDetail({ contractId: 'contract-id', myCompanyId: 'my-company-id' })

        expect(mockAxios.history.post[0].url).toEqual(getContractUrl)
        expect(res.error).toEqual('Network Error')
    })
})

describe('deleteTargetProject case', () => {
    it('projectId = undefined test', async () => {
        const res = await deleteTargetProject({ projectId: undefined })
        expect(res.error).toEqual('idが足りません。')
    })

    it('success test', async () => {
        _deleteProject('project-id' || 'no-id')

        const res = await deleteTargetProject({ projectId: 'project-id' })
        console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(deleteProjectUrl)
        expect(res.success).toEqual(true)
    })

    it('error test', async () => {
        mockAxios.onPost(deleteProjectUrl).networkError()

        const res = await deleteTargetProject({ projectId: 'project-id' })

        expect(mockAxios.history.post[0].url).toEqual(deleteProjectUrl)
        expect(res.error).toEqual('Network Error')
    })
})

// describe('getProjectForEdit case', () => {

//     it('projectId = undefined test', async() => {
//         const res = await getProjectForEdit({ myCompanyId: 'my-company-id', projectId: undefined })
//         expect(res.error).toEqual('idがありません。')
//     })
//     it('myCompanyId = undefined test', async() => {
//         const res = await getProjectForEdit({ myCompanyId: undefined, projectId: 'project-id' })
//         expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
//     })

//     it('success test', async() => {

//         _getProject({
//             projectId: 'project-id',
//             options: {
//                 orderDepartments: true,
//                 superConstruction: {
//                     displayName: true,
//                     constructionRelation: {
//                         params: {
//                             companyId: 'my-company-id',
//                         },
//                     },
//                 },
//                 orderCompany: {
//                     companyPartnership: {
//                         params: {
//                             companyId: 'my-company-id',
//                         },
//                     },
//                     lastDeal: {
//                         params: {
//                             myCompanyId: 'my-company-id',
//                         },
//                     },
//                 },
//                 receiveCompany: {
//                     companyPartnership: {
//                         params: {
//                             companyId: 'my-company-id',
//                         },
//                     },
//                 },
//                 project: true,
//             },

//         })

//         const res = await getProjectForEdit({ projectId: 'project-id', myCompanyId: "my-company-id" })
//         console.log(res);

//         expect(mockAxios.history.post[0].url).toEqual(getProjectUrl);
//         expect(res.success?.projectId).toEqual('project-id')
//       })

//     it('error test', async () => {
//         mockAxios.onPost(getProjectUrl).networkError();

//         const res = await getProjectForEdit({ projectId: 'project-id', myCompanyId: "my-company-id" })

//         expect(mockAxios.history.post[0].url).toEqual(getProjectUrl);
//         expect(res.error).toEqual('Network Error');
//       })

// })
