import { TableResult } from './table';
import { FormResult } from './form';
import { useLocale } from '../localization/locale'
import * as url from 'url';

export const cleanText = (text: string = '') => {
  const txt = text
    .replace(/ +\n/g, '\n')
    .replace(/\s+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/　+/g, ' ')
    .replace(/  +/g, ' ')
    .replace(/\n +/g, '\n')
    .replace(/\n　+/g, '\n')
    .replace(/\n\t+/g, '\n')
    .trim();
  return txt;
};

export const getTableDescription = (tableResult: TableResult,lang:string = 'ja') => {
  let description = '';

  if(tableResult.totalRows == 0 || tableResult.totalCols == 0) return description;

  description = `${useLocale('TableNumberRow', lang, tableResult.totalRows.toString())}、${useLocale('TableNumberColumn', lang, tableResult.totalRows.toString())}\n`;

  if (tableResult.caption) {
    description += `${useLocale('TableCaption', lang, tableResult.caption)}\n`;
  }

  let title_str = tableResult.titles?.join('、') || 'no_titlte';

  if (tableResult.titles && tableResult.titles.length > 0) {
    description += `${useLocale('TableTitle',lang, tableResult.titles.join('、'))}\n`;
  }

  let currentIndex = 0;

  tableResult.rows.forEach((row, i) => {
    let rowText = '';
    let rowTextRaw = '';

    if (row.cols && row.cols.length > 0) {
      if (currentIndex == 0) {
        rowText += useLocale('Table1stRow',lang);
      } else {
        rowText += `${useLocale('TableRow',lang, (currentIndex + 1).toString())}`;
      }

      row.cols.forEach((col, j) => {
        rowText += col + '、';
        rowTextRaw+= col;
      });

      if(!rowTextRaw){
        return;
      }

      if(rowText && !rowText.includes(title_str)){
        if (i == tableResult.rows.length - 1) {
          description += `${rowText}${useLocale('TableEnd',lang)}`;
        } else {
          description += `${rowText}\n`;
        }
        currentIndex++;
      }
    }
  });

  if(currentIndex == 0){
    description = '';
  }

  return description;
};

export const getTableDescriptionForRAGT = (tableResult: TableResult,lang:string = 'ja') => {
  let description = '';

  if(tableResult.totalRows == 0 || tableResult.totalCols == 0) return description;

  let title_str = tableResult.titles?.join('、') || 'no_titlte';

  let currentIndex = 0;

  tableResult.rows.forEach((row, i) => {
    let rowText = '';
    let rowTextRaw = '';

    if (row.cols && row.cols.length > 0) {
      if (currentIndex == 0) {
        rowText += useLocale('Table1stRow',lang);
      } else {
        rowText += `${useLocale('TableRow',lang, (currentIndex + 1).toString())}`;
      }

      row.cols.forEach((col, j) => {
        rowText += col + '、';
        rowTextRaw+= col;
      });

      if(!rowTextRaw){
        return;
      }

      if(rowText && !rowText.includes(title_str)){
        if (i == tableResult.rows.length - 1) {
          description += `${rowText}${useLocale('TableEndRAGT',lang)}`;
        } else {
          description += `${rowText}\n`;
        }
        currentIndex++;
      }
    }
  });

  if(currentIndex == 0){
    description = '';
  }

  return description;
};

export const getFormDescription = (
  formResult: FormResult,
  loadedUrl: string,
  lang:string='ja'
) => {
  let description = '';

  let action = formResult.action;

  // if action if relative path, convert to absolute path
  if (action && action.startsWith('/')) {
    const parsedUrl = url.parse(loadedUrl);
    action = `${parsedUrl.protocol}//${parsedUrl.host}${action}`;
  }

  description = `${useLocale('Form', lang)}\n`;
  description += formResult.data['submit']
    ? formResult.data['submit'] + '\n'
    : '';
  description += action;

  return description;
};


