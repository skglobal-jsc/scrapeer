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
  $: any,
  tableElm: any | string
) => {
  const $table = $(tableElm);
  const $rows = $table.find('tr');

  const totalRows = $rows.length;
  const totalCols = $rows.first().find('td').length;
  // find caption of table
  const caption = $table.find('caption').text().replace(/\n/g, '').trim();

  // loop through each row
  const rows: any = [];
  $rows.each((i, row) => {
    const $row = $(row);
    const cells: any = [];
    $row.find('td').each((j, col) => {
      const $col = $(col);
      const text = $col.text().replace(/\n/g, '').trim();
      cells.push(text);
    });
    rows.push({
      index: i + 1,
      cells,
    });
  });

  const result = {
    caption,
    totalRows,
    totalCols,
    rows,
  };
  return result;
};
