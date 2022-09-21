import cheerio from 'cheerio';

interface IArticle {
  id: string;
  title: string;
  publishDate: string;
  crawledAt: string;
  URL: string;
  description: string;
  thumbnailURL?: string;
  topic?: string | string[];

  // IF can be added many more fields
  [key: string]: any;
}

/**
 * this is my simple parser to parse table. It's not perfect but it works. You can improve it
 * @param $
 * @param tableElm
 * @returns
 */
export const parseTable = (
  $: cheerio.CheerioAPI,
  tableElm: cheerio.Element | string
) => {
  const $table = $(tableElm);
  const $rows = $table.find('tr');
  const result: any[] = [];
  $rows.each((i, tr) => {
    const $tr = $(tr);
    const $cells = $tr.find('td');
    const row: any = {};
    $cells.each((j, td) => {
      const $td = $(td);
      row[j] = $td.text().trim();
    });
    result.push(row);
  });
  return result;
};

/**
 * This is a sample function to parse form in a webpage. Let improve it
 * @param $
 * @param formElm
 * @returns
 */
export const parseForm = ($: cheerio.CheerioAPI, formElm: cheerio.Cheerio) => {
  const action = formElm.attr('action');
  const method = formElm.attr('method');
  const inputs = formElm.find('input');
  const data = {};
  inputs.each((i, input) => {
    const name = $(input).attr('name');
    const value = $(input).attr('value');
    if (name) {
      data[name] = value;
    }
  });
  return {
    action,
    method,
    data,
  };
};

/**
 * This function is used to description of the article
 * @param $ Cheerio object
 * @param item article object, let see the interface IArticle
 * @returns you can return anything you want
 */
export const generateDescriptionFromDom = (
  $: cheerio.CheerioAPI,
  item: IArticle
): any => {
  // because of these function will be called from extendFunction. So, we can to pass $ and item as parameter
  console.log('This is a sample function');

  return {
    ...item,
  };
};
