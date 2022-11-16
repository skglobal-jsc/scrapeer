import {
  cleanText,
  getTableDescription,
  getFormDescription,
} from './parsers/utils';
import { TableResult } from './parsers/table';
import { parseForm } from './parsers';

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

const parseHref = (
  $: cheerio.Root,
  element: cheerio.Element | string,
  item: IArticle
): string => {
  let description: string = '';
  const { loadedUrl = '' } = item;
  let domain = new URL(loadedUrl).origin + '/';

  let domElm = element as any;
  let text_a = '';
  if (domElm.children && domElm.children.length > 0) {
    text_a = extractTextFromDom($, $(domElm), item);
    description += text_a;
  }
  if (domElm.attribs.href && !domElm.attribs.href.includes(text_a)) {
    if (domElm.attribs.href.includes('http')) {
      description += '\n' + domElm.attribs.href + '\n';
    } else {
      if (
        !domElm.attribs.href.includes('/') &&
        domElm.attribs.href.includes('#')
      ) {
        description += '\n' + loadedUrl + domElm.attribs.href + '\n';
      } else {
        //TODO domain name extraction
        description += '\n' + domain + domElm.attribs.href + '\n';
      }
    }
  }

  return description;
};

const parseImage = (
  $: cheerio.Root,
  element: cheerio.Element | string,
  item: IArticle
): string => {
  const $element = $(element);
  const { loadedUrl = '' } = item;

  let domain = new URL(loadedUrl).origin + '/';

  let textContent = '';
  if ((element as any).attribs.href && (element as any).attribs.alt !== 'pdf') {
    textContent +=
      '\n\nここに「' +
      (element as any).attribs.alt +
      '」の画像があります。' +
      '\n';

    if ((element as any).attribs.src.includes('http')) {
      textContent += (element as any).attribs.src + '\n\n';
    } else {
      textContent += domain + (element as any).attribs.src + '\n\n';
    }
  }

  return textContent;
};

const parseParagraph = (
  $: cheerio.Root,
  element: cheerio.Element | string,
  item: IArticle
): string => {
  const $element = element as any;
  const { loadedUrl = '' } = item;

  let domain = new URL(loadedUrl).origin + '/';

  let description = '';
  var link = '';

  if ($element.children.length > 0) {
    for (let j = 0; j < $element.children.length; j++) {
      const child = $element.children[j];

      if (!child) continue;

      const tagType = child.type;
      const tagName = child.name;

      // console.log('tagType', tagType);
      // console.log('tagName', tagName);

      if (tagType == 'text') {
        if (child.data) {
          description += child.data;
        }
        continue;
      }
      switch (tagName) {
        case 'br':
          description += '\n';
          break;
        case 'a':
          let text_a = '';
          if (child.children && child.children.length > 0) {
            text_a = parseParagraph($, child, item);
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
                link = ' - ' + loadedUrl + child.attribs.href + ' ';
              } else {
                link = ' - ' + domain + child.attribs.href + ' ';
              }
            }
          }

          description += link;
          break;
        case 'span':
          description += parseParagraph($, child, item);
          break;
        // case 'li':
        //   description += parseParagraph($, child, item);
        //   break;
        case 'strong':
          description += parseParagraph($, child, item);
          break;
        case 'div':
          description += parseParagraph($, child, item);
          break;
        case 'p':
          description += parseParagraph($, child, item);
          break;
        case 'table':
          description += getTableDescription(parseTable($, child, item));
          break;
        case 'ol':
          description += parseOLComponent($, child, item);
          break;
        case 'form':
          description += `この下に入力用のフォームがあります。\nフォームに入力する場合は、「詳細はこちら」を押して元ページを開いてください。`;
          break;
        case 'img':
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
          } else {
            if (!child.attribs.alt) {
              description += '\n\nここに画像があります。\n';

              if (child.attribs.src.includes('http')) {
                description += child.attribs.src + '\n\n';
              } else {
                description += domain + child.attribs.src + '\n\n';
              }
            }
          }
          break;
        default:
          description += extractTextFromDom($, $(child), item);
          break;
      }
    }
  }
  return description;
};

const parseOLComponent = (
  $: cheerio.Root,
  element: cheerio.Element | string,
  item: IArticle
): string => {
  const $element = $(element);
  let description = '';
  let numberItem = 1;

  const $els = $element.find('li');

  if ($els.length > 0) {
    $element.find('li').each((i, col) => {
      description += (i+1) + '. ' + parseParagraph($, col, item) + '\n';
    });
  }
  return description;
};

const parseTable = (
  $: cheerio.Root,
  element: cheerio.Element | string,
  item: IArticle
): TableResult => {
  const $table = $(element);
  const rows: any = [];
  const titles: any = [];

  // find caption of table
  const caption = cleanText($table.find('caption').text());
  const $rows = $table.find('tr');
  const $titles = $table.find('th');

  let totalRows = $rows.length;
  let totalCols = $rows.first().find('th, td').length;

  let bodyText = $($table).find('tbody').text().trim();
  if (bodyText.includes('jQuery(function()')) {
    totalRows = 0;
    totalCols = 0;
  } else {
    if (totalRows > 0) {
      totalCols = $($rows[0]).find('th,td').length;
    }

    $table.find('th').each((i, col) => {
      const $col = $(col);
      const text = cleanText($col.text());
      titles.push(text);
    });

    // loop through each row
    $rows.each((i, row) => {
      const $rowAtIndex = $(row);
      const cols: any = [];
      $rowAtIndex.find('th,td').each((j, col) => {
        const $col = $(col);
        // const text = cleanText($col.text());
        const text = parseParagraph($, col, item).trim();
        cols.push(text);
      });
      rows.push({
        index: i + 1,
        cols,
      });
    });
  }

  const result = {
    caption,
    totalRows,
    totalCols,
    titles,
    rows,
  };
  return result;
};

const extractTextFromDom = (
  $: cheerio.Root,
  $el: cheerio.Cheerio,
  item: IArticle
) => {
  let description = '';

  if (!$el) return '';

  // get children
  const $children = $el.children();

  // if there are no children, return the text
  if ($children.length === 0) {
    description += cleanText($el.text());
  } else {
    // if there are children, get the text from each child
    $children.each((i, child) => {
      const $child = $el.children().eq(i);
      // if the child is a text node, return the text
      const tagName = $child.prop('tagName');

      switch (tagName) {
        case 'BR':
          description += '\n';
          break;
        case 'TEXT':
          description += cleanText($child.text());
          break;
        case 'A':
          description += parseHref($, child, item);
          break;
        case 'IMG':
          description += parseImage($, child, item);
          break;
        case 'TABLE':
          description += parseParagraph($, child, item);
          break;
        case 'FORM':
          description = `この下に入力用のフォームがあります。\nフォームに入力する場合は、「詳細はこちら」を押して元ページを開いてください。`;
          break;
        case 'H2':
          description += '●' + extractTextFromDom($, $child, item) + '\n';
          break;
        case 'P':
        case 'DIV':
          description += parseParagraph($, child, item) + '\n';
          break;
        case 'OL':
          description += parseOLComponent($, child, item) + '\n';
          break;
        case 'H1':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'SPAN':
        case 'TD':
        case 'TH':
        case 'UL':
        case 'DL':
        case 'DD':
        case 'DT':
        case 'SECTION':
          description += extractTextFromDom($, $child, item) + '\n';
          break;
        default:
          // description += parseParagraph($, child, item);
          break;
      }
    });
  }
  return description;
};

const generateDescriptionFromDom = (
  $: cheerio.Root,
  item: IArticle,
  contentSector: string = 'body'
): any => {
  const $content = $(contentSector);
  let description = extractTextFromDom($, $content, item);
  description = cleanText(description);

  return description;
};

const convert2byteNumberTo1byte = (num_str) => {
  var rex = /[\uFF10-\uFF19]/g;
  var str = num_str;

  str = str.replace(rex, function (ch) {
    return String.fromCharCode(ch.charCodeAt(0) - 65248);
  });
};

export { generateDescriptionFromDom, parseTable, convert2byteNumberTo1byte };
