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
  loadedUrl?: string;

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
  $: cheerio.Root,
  tableElm: cheerio.Element | string
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
    const cols: any = [];
    $row.find('td').each((j, col) => {
      const $col = $(col);
      const text = $col.text().replace(/\n/g, '').trim();
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
  const result = { ...item };
  // because of these function will be called from extendFunction. So, we can to pass $ and item as parameter
  let url = '';
  let domain = '';
  //This is function to parse common DOM to text
  const getTextFromDom = (domItem) => {
    let textContent = '';
    if (domItem.children.length > 0) {
      for (let j = 0; j < domItem.children.length; j++) {
        const child = domItem.children[j];

        const type = child.type;
        if (!child) continue;

        if (child.name == 'br') {
          textContent += '\n';
          continue;
        } else if (type == 'text' && child.data) {
          textContent += child.data;
        } else if (type == 'tag') {
          const name = child.name;
          if (name == 'h2') {
            textContent += '●' + getTextFromDom(child);
          } else if (name == 'h3') {
            textContent += getTextFromDom(child);
          } else if (name == 'a') {
            let text_a = '';
            if (child.children && child.children.length > 0) {
              text_a = getTextFromDom(child);
              textContent += text_a;
            }
            if (child.attribs.href && !child.attribs.href.includes(text_a)) {
              if (child.attribs.href.includes('http')) {
                textContent += '\n' + child.attribs.href + '\n';
              } else {
                if (
                  !child.attribs.href.includes('/') &&
                  child.attribs.href.includes('#')
                ) {
                  textContent += '\n' + url + child.attribs.href + '\n';
                } else {
                  textContent += '\n' + domain + child.attribs.href + '\n';
                }
              }
            }
          } else if (name == 'p') {
            textContent += getTextForPTag(child);
          } else if (name == 'span') {
            textContent += getTextForPTag(child);
          } else if (['dl', 'ol', 'ul', 'div'].includes(name)) {
            textContent += getTextFromDom(child);
          } else if (['dd'].includes(name)) {
            textContent += getTextFromDom(child).trim();
          } else if (['dt'].includes(name)) {
            textContent += '\n\n' + getTextFromDom(child).trim();
          } else if (name == 'table') {
            textContent += parseTable(child);
          } else if (['td', 'tr'].includes(name)) {
            textContent += getTextFromDom(child) + '\n';
          } else if (name == 'li') {
            textContent += getTextFromDom(child) + '\n';
          } else if (name == 'strong') {
            textContent += getTextFromDom(child);
          } else if (name == 'img') {
            if (child.attribs.alt && child.attribs.alt !== 'pdf') {
              textContent +=
                '\n\nここに「' +
                child.attribs.alt +
                '」の画像があります。' +
                '\n';

              if (child.attribs.src.includes('http')) {
                textContent += child.attribs.src + '\n\n';
              } else {
                textContent += domain + child.attribs.src + '\n\n';
              }
            }
          }
        }
      }
    }

    return textContent;
  };

  //This is function to parse p tag to text
  const getTextForPTag = (p) => {
    let description = '';
    if (p.children.length > 0) {
      var link = '';
      for (let j = 0; j < p.children.length; j++) {
        const child = p.children[j];
        if (!child) continue;
        if (child.name == 'br') {
          description += '\n';
          continue;
        } else if (child.type == 'text') {
          if (child.data) {
            description += child.data.trim();
          } else {
            continue;
          }
        } else if (child.name == 'a') {
          let text_a = '';
          if (child.children && child.children.length > 0) {
            text_a = getTextFromDom(child);
            description += text_a;
          }
          if (child.attribs.href && !child.attribs.href.includes(text_a)) {
            if (child.attribs.href.includes('http')) {
              link = ' - ' + child.attribs.href + ' ';
            } else {
              if (
                !child.attribs.href.includes('/') &&
                child.attribs.href.includes('#')
              ) {
                link = ' - ' + url + child.attribs.href + ' ';
              } else {
                link = ' - ' + domain + child.attribs.href + ' ';
              }
            }
          }

          description += link;
        } else if (child.name == 'span') {
          description += getTextForPTag(child);
        } else if (child.name == 'strong') {
          description += getTextFromDom(child);
        } else if (child.name == 'img') {
          if (child.attribs.alt && child.attribs.alt !== 'pdf') {
            description +=
              '\n\nここに「' +
              child.attribs.alt +
              '」の画像があります。' +
              '\n';

            if (child.attribs.src.includes('http')) {
              description += child.attribs.src + '\n\n';
            } else {
              description += domain + child.attribs.src + '\n\n';
            }
          }
        }
      }
    }
    return description;
  };

  //Parse content of table to text
  //
  const parseTable = (table) => {
    let tableText = '';
    let numberOfColumns = 0;
    const outerHTML = $.html($(table));
    console.log('body', table);
    const caption = $(outerHTML).find('caption').text();
    const rows = $(outerHTML).find('tbody tr');
    const header = $(outerHTML).find('tbody th');

    let bodyText = $(outerHTML).find('tbody').text().trim();
    if (!bodyText || bodyText.includes('jQuery(function()')) {
      console.log('No content');
      return '';
    }
    // console.log("body",  $(outerHTML).find("tbody").text());

    if (rows.length > 0) {
      numberOfColumns = $(rows[0]).find('th,td').length;
    }
    tableText = `\nこの下に、縦${rows.length}行、横${numberOfColumns}列の表があります。\n`;

    if (caption) {
      tableText += `表のタイトルは${caption}、です。\n`;
    }

    let currentIndex = 0;

    rows.each((i, row) => {
      let rowText = '';

      const data = $(row).find('th,td');
      const data_th = $(row).find('th');

      // console.log("data: ", data['0'])

      if (i == 0 && data_th.length > 1) {
        let header_arr = data_th.map((i, el) => $(el).text()).get();
        tableText += `見出し行は左から${header_arr.join('、')}です。\n`;
        return;
      }

      if (data && data.length > 0) {
        if (currentIndex == 0) {
          rowText += 'データの1行目、';
        } else {
          rowText += `${currentIndex + 1}行目、`;
        }

        data.each((j, d) => {
          const text = getTextFromDom(d); //$(d).text();
          rowText += text + '、';
        });
        currentIndex++;
      }

      if (i == rows.length - 1) {
        tableText += `${rowText}です。\n表の終わりです。`;
      } else {
        tableText += rowText + '\n';
      }
    });

    return tableText;
  };

  result.description =
    result.title +
    '\n' +
    result.publishDate +
    '\n\n' +
    getTextFromDom($)
      .replace(/  *\n/g, '\n')
      .replace(/\s+\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n');

  console.log('result.description', result.description);

  return result;
};
