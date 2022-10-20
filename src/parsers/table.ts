import { cleanText } from './utils';

export interface CellResult {
  index: number;
  cols: string[];
}

export interface TableResult {
  caption?: string;
  totalRows: number;
  totalCols: number;
  rows: CellResult[];
}

/**
 * this is my simple parser to parse table. It's not perfect but it works. You can improve it
 * @param $
 * @param element - table element or selector
 * @returns
 */
const parser = (
  $: cheerio.Root,
  element: cheerio.Element | string
): TableResult => {
  const $table = $(element);
  const $rows = $table.find('tr');

  const totalRows = $rows.length;
  const totalCols = $rows.first().find('td').length;
  // find caption of table
  const caption = cleanText($table.find('caption').text());

  // loop through each row
  const rows: any = [];
  $rows.each((i, row) => {
    const $row = $(row);
    const cols: any = [];
    $row.find('td').each((j, col) => {
      const $col = $(col);
      const text = cleanText($col.text());
      cols.push(text);
    });
    rows.push({
      index: i + 1,
      cols,
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

export default parser;
