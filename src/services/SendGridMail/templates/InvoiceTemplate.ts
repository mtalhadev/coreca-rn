import { InvoiceParamType } from '../index';

export default function (params: InvoiceParamType) {
  const { fileData, mailInfo } = params;
  let html = '';
  if (!fileData || fileData.length < 0) {
    html = '明細が取得できませんでした。';
  } else if (mailInfo.commonInvoice && mailInfo.targetCompanyInvoice) {
    html ='<ul><li>対象社名： ' +
      mailInfo.targetCompanyInvoice.companyName +
      '</li><li>対象月: ' +
      mailInfo.commonInvoice.month +
      '</li><li>作成日時: ' +
      mailInfo.commonInvoice.today +
      '</li><li>作成者: ' +
      mailInfo.commonInvoice.myWorkerName +
      '</li><li>部署: ' +
      mailInfo.commonInvoice.departments +
      '</li></ul>';
  } else if (mailInfo.commonInvoice && mailInfo.workerInvoice) {
    html = '</li><li>対象月: ' +
      mailInfo.commonInvoice.month +
      '</li><li>作成日時: ' +
      mailInfo.commonInvoice.today +
      '</li><li>作成者: ' +
      mailInfo.commonInvoice.myWorkerName +
      '</li><li>部署: ' +
      mailInfo.commonInvoice.departments +
      '</li></ul>';
  } else if (mailInfo.commonInvoice) {
    html = '</li><li>対象月: ' +
      mailInfo.commonInvoice.month +
      '</li><li>作成日時: ' +
      mailInfo.commonInvoice.today +
      '</li><li>作成者: ' +
      mailInfo.commonInvoice.myWorkerName +
      '</li><li>部署: ' +
      mailInfo.commonInvoice.departments +
      '</li></ul>';
  } else {
    html = '';
  }
  return `<div>${html}</div>`;
}
