import { applicationName } from 'expo-application';

export default function () {
  return `<footer style="
            margin-top: 5px;
            border-top: 1px solid;
            padding-top: 5px;
            text-align: center;
    ">
        ${applicationName ?? 'CORECA APP'}
    </footer>`;
}
