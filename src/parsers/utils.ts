import { TableResult } from "./table";

export const cleanText = (text: string = '') => {
  const txt = text
    .replace(/  *\n/g, '\n')
    .replace(/\s+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n');
  return txt;
};

export const getTableDescription = (tableResult: TableResult) => {
  let description = '';

  description = `この下に、縦${tableResult.totalRows}行、横${tableResult.totalCols}列の表があります。\n`;

  if (tableResult.caption) {
    description += `表のタイトルは${tableResult.caption}、です。\n`;
  }

  if(tableResult.titles && tableResult.titles.length > 0){
    description += `見出し行は左から${tableResult.titles.join(
      '、'
    )}です。\n`;
  }

  let currentIndex = 0;

  tableResult.rows.forEach((row, i) => {
    let rowText = '';

    if (row.cols && row.cols.length > 0) {
      if (currentIndex == 0) {
        rowText += 'データの1行目、';
      } else {
        rowText += `${currentIndex + 1}行目、`;
      }

      row.cols.forEach((col, j) => {
        rowText += col + '、';
      });

      if (i == tableResult.rows.length - 1) {
        description += `${rowText}です。\n表の終わりです。`;
      }else{
        description += `${rowText}\n`;
      }
      currentIndex++;
    }
  });
  return description;
};