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
  $: any,
  element: any | string,
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
    if (domElm.attribs.href.includes('https://get.adobe.com/jp/reader/')) {
      return '';
    }

    if (domElm.attribs.href.includes('http')) {
      description += '\n' + domElm.attribs.href + '\n';
    } else {
      // if (
      //   !domElm.attribs.href.includes('/') &&
      //   domElm.attribs.href.includes('#')
      // ) {
      //   description += '\n' + loadedUrl + domElm.attribs.href + '\n';
      // } else {
      //   //TODO domain name extraction
      //   description += '\n' + domain + domElm.attribs.href + '\n';
      // }

      if (!domElm.attribs.href.includes('#')) {
        description += '\n' + domain + domElm.attribs.href + '\n';
      } else {
        description ='';
      }
    }
  }

  if (description.includes('javascript') || description.includes('#')) {
    description = '';
  }

  return description;
};

const parseImage = (
  $: any,
  element: any | string,
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
  $: any,
  element: any | string,
  item: IArticle
): string => {
  const $element = element as any;
  const { loadedUrl = '' } = item;

  let domain = new URL(loadedUrl).origin + '/';
  let domainForImg = loadedUrl.substring(0, loadedUrl.lastIndexOf('/')+1);

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
      // console.log('data', child.data);

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
          }
          if (child.attribs.href && !child.attribs.href.includes(text_a)) {
            if (child.attribs.href.includes('https://get.adobe.com/jp/reader/')) {
              continue;
            }
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

          if (link.includes('javascript') || link.includes('#')) {
            link = '';
          } else {
            description += text_a;
          }

          description += link;
          break;
        case 'span':
          const desc_span = parseParagraph($, child, item);

          if(!isIgnoreText(desc_span)){
            description += desc_span;
          }
          break;
          break;
        case 'h1':
        case 'h3':
        case 'h4':
        case 'h5':
          description += '\n' + parseParagraph($, child, item) + '\n';
          break;
        // case 'li':
        //   description += parseParagraph($, child, item);
        //   break;
        case 'strong':
          const desc_strong = parseParagraph($, child, item);

          if(!isIgnoreText(desc_strong)){
            description += desc_strong;
          }
          break;
        case 'div':
          //ignore social area in https://www.city.sapporo.jp/
          // if (isIgnoreTag(child as any, loadedUrl)) {
          //   continue;
          // }
          const desc_div = parseParagraph($, child, item);

          if(!isIgnoreText(desc_div)) {
            description += desc_div;
          }

          break;
        case 'p':
          const desc_p = parseParagraph($, child, item) + '\n';

          if(!isIgnoreText(desc_p)){
            description += desc_p;
          }

          break;
        case 'table':
          description += getTableDescription(parseTable($, child, item));
          break;
        case 'ol':
          description += parseOLComponent($, child, item);
          break;
        case 'ul':
          description += parseULComponent($, child, item);
          break;
        case 'form':
          //description += `この下に入力用のフォームがあります。\nフォームに入力する場合は、「詳細はこちら」を押して元ページを開いてください。`;
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
              let src = String(child.attribs.src);
                if(src.startsWith('/')){
                  description += domain + src + '\n\n';
                }else{
                  description += domainForImg + src + '\n\n';
                }
            }
          } else {
            if (!child.attribs.alt) {
              description += '\n\nここに画像があります。\n';

              if (child.attribs.src.includes('http')) {
                description += child.attribs.src + '\n\n';
              } else {
                let src = String(child.attribs.src);
                if(src.startsWith('/')){
                  description += domain + child.attribs.src + '\n\n';
                }else{
                  description += domainForImg + child.attribs.src + '\n\n';
                }
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
  $: any,
  element: any | string,
  item: IArticle
): string => {
  const $element = $(element);
  let description = '';
  let numberItem = 1;

  const $els = $element.find('li');

  if ($els.length > 0) {
    $element.find('li').each((i, col) => {
      description += i + 1 + '. ' + parseParagraph($, col, item) + '\n';
    });
  }
  return description;
};

const parseULComponent = (
  $: any,
  element: any | string,
  item: IArticle
): string => {
  const $element = $(element);
  let description = '';
  let numberItem = 1;

  const $els = $element.find('li');

  if ($els.length > 0) {
    $element.find('li').each((i, col) => {
      description += parseParagraph($, col, item) + '\n';
    });
  }
  return description;
};

const parseTable = (
  $: any,
  element: any | string,
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

const isIgnoreText = (text: string): boolean => {
  //ignore social area in https://www.city.sapporo.jp/
  if(text.includes('Acrobat Reader') ||
    text.includes('Adobe Reader') ||
      text.includes('adobe.com/jp') ||
      text.includes('function(') ||
      text.includes('connect.facebook.net') ||
      text.toLowerCase().includes('line-website.com') ||
      text.toLowerCase().includes('document.write(') ||
      text.toLowerCase().includes('twitter.com')||
      text.toLowerCase().includes('hatena')){
    return true;
  }

  return false;
};

const isIgnoreTag = (element: any | string, loadedUrl: string): boolean => {
  //ignore social area in https://www.city.sapporo.jp/
  if (
    element.attribs &&
    element.attribs.class &&
    element.attribs.class.includes('rs-skip')
  ) {
    return true;
  } else if (
    element.attribs &&
    element.attribs.class &&
    element.attribs.class.includes('plugin')
  ) {
    if (loadedUrl.includes('aomori.aomori.jp')) {
      return true;
    }
  } else if (
    element.attribs &&
    element.attribs.class &&
    (element.attribs.class.includes('pdf_download') || element.attribs.class.includes('adobeReader') || element.attribs.class.includes('adobe-reader'))
  ) {
    return true;
  } else if (
    element.attribs &&
    element.attribs.id &&
    (element.attribs.id.includes('button_sns') ||
      element.attribs.id.includes('sns_button') ||
      element.attribs.id.includes('tmp_hatena') ||
      element.attribs.id.includes('tmp_mixi'))
  ) {
    return true;
  }

  return false;
};

const extractTextFromDom = (
  $: any,
  $el: any,
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
          // description += parseParagraph($, child, item);
          description += getTableDescription(parseTable($, child, item));
          break;
        // case 'FORM':
        //   description = `この下に入力用のフォームがあります。\nフォームに入力する場合は、「詳細はこちら」を押して元ページを開いてください。`;
        //   break;
        case 'H2':
          description += '●' + parseParagraph($, child, item) + '\n';
          break;
        case 'P':
        case 'DIV':
          const { loadedUrl = '' } = item;
          if (isIgnoreTag(child as any, loadedUrl)) {
            break;
          }
          description += parseParagraph($, child, item) + '\n';
          break;
        case 'OL':
          description += parseOLComponent($, child, item) + '\n';
          break;
        case 'UL':
          description += parseULComponent($, child, item) + '\n';
          break;
        case 'H1':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'HEADER':
        case 'SPAN':
          description += parseParagraph($, child, item) + '\n';
          break;
        case 'TD':
        case 'TH':
        case 'DL':
        case 'DD':
        case 'DT':
        case 'SECTION':
        case 'ARTICLE':
          description += extractTextFromDom($, $child, item) + '\n';
          break;
        default:
          // description += extractTextFromDom($, $child, item) + '\n';
          break;
      }
    });
  }
  return description;
};

const generateDescriptionFromDom = (
  $: any,
  item: IArticle,
  contentSector: string = 'body',
  titleEle?: any
): any => {
  const $content = $(contentSector);

  if (titleEle) {
    const $title = $(titleEle);


    // find all elements before the title element and remove them
    $title.prevAll().remove();

    // also remove title element to make sure it is not part of the description
    $title.remove();
  }

  let description = extractTextFromDom($, $content, item);

  // console.log('description before', description);
  // let startIndex = description.indexOf(item.title);

  // startIndex = startIndex > 0 ? startIndex : 0;

  // description = cleanText(description.substring(startIndex));

  description += '\n\n' + '以上です。'
  // description = cleanText(description);
  // console.log('description after', description);
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
