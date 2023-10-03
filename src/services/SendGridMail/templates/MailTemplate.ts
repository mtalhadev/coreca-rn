import Header from './Header';
import Footer from './Footer';
import { THEME_COLORS } from '../../../utils/Constants';

export default function (
  title: string,
  content: string,
) {
  const header = Header();
  const footer = Footer();
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
  <head>
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
    <title>${title}</title>
  </head>
  <body>
    <div style="
        background-color: ${THEME_COLORS.OTHERS.BACKGROUND};
        font-family: 'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;
        font-size: 16px;
        vertical-align: top;
        display: block;
        width: 100%;
        max-width: 600px;
        margin: 0 auto !important;
        padding: 15px;
      ">
      ${header}
      <div>
        ${content}
      </div>
      ${footer}
    </div>
  </body>
</html>`;
}
