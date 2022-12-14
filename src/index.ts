import {
  cleanText,
  getTableDescription,
  getFormDescription,
} from './parsers/utils';
import { TableResult } from './parsers/table';
import { parseForm } from './parsers';
import * as cheerio from 'cheerio';
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

const parseParagraph = (
  $: any,
  element: any | string,
  item: IArticle
): string => {
  const $element = element as any;
  const { loadedUrl = '' } = item;
  let description = '';
  var link = '';

  if ($element.children.length > 0) {
    for (let j = 0; j < $element.children.length; j++) {
      const child = $element.children[j];

      if (!child) continue;

      let ori_html = String($(child).html())
      let first_line_html = ori_html.substring(0,ori_html.indexOf('>'));
      if(first_line_html && first_line_html.length > 0){
        const regEx = /display.*:.*none/;
        // console.log('ori_first_html[0]',ori_html);
        console.log('regEx.test',regEx.test(first_line_html));
        if(first_line_html.includes('display:*none')){
          continue;
        }
      }

      const tagType = child.type;
      const tagName = child.name;

      // console.log('tagType', tagType);
      // console.log('tagName', tagName);
      // console.log('data', child.data);

      if (tagType == 'text') {
        if (child.data && !isIgnoreText(child.data)) {
          description += child.data.replace(/[\u200B-\u200D\uFEFF]/g, '');
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

          const href = child.attribs.href ? String(child.attribs.href) : '';
          if (href) {
            if (!href.includes(text_a)) {
              if (href.includes('https://get.adobe.com/jp/reader/')) {
                continue;
              }
              if (href.includes('http')) {
                link = ' - ' + href + ' ';
              } else {
                const path = new URL(href, loadedUrl);
                link = ' - ' + path.href + ' ';
              }
            }
          }
          if (isIgnoreText(link)) {
            link = '';
          } else {
            if(link.includes('#')){
              let isParentLi = false;
              let parent = child.parent;
              do{
                if(parent && parent.name && parent.name === 'li'){
                  isParentLi = true;
                  break;
                }
                parent = parent.parent;
              }while(parent);

              if(isParentLi){
                link = '';
                description += text_a;
              }else{
                link = '';
                text_a='';
              }
            }else{
              description += text_a;
            }
          }

          description += link;
          break;
        case 'span':
          const desc_span = parseParagraph($, child, item);

          if (!isIgnoreText(desc_span)) {
            description += desc_span;
          }
          break;
        case 'h2':
          let text_h2 = parseParagraph($, child, item).trim();
          if(text_h2){
            description += '●' + text_h2 + '\n';
          }
          break;
        case 'h1':
        case 'h3':
        case 'h4':
        case 'h5':
          let text_h = parseParagraph($, child, item).trim();
          if(text_h){
            description += text_h + '\n';
          }

          break;
        case 'header':
        case 'section':
        case 'article':
        case 'address':
          let text_component = parseParagraph($, child, item).trim();
          if(text_component){
            description += '\n' + text_component + '\n';
          }
          break;
        case 'h6':
          let text_h6 = parseParagraph($, child, item).trim();
          if(text_h6){
            description += text_h6 + '\n';
          }
          break;
        case 'strong':
          const desc_strong = parseParagraph($, child, item);

          if (!isIgnoreText(desc_strong)) {
            description += desc_strong;
          }
          break;
        case 'div':
          const desc_div = parseParagraph($, child, item);

          if (desc_div && !isIgnoreText(desc_div)) {
            description += desc_div + '\n';
          }

          break;
        case 'p':
          const desc_p = parseParagraph($, child, item);

          if (desc_p && !isIgnoreText(desc_p)) {
            description += desc_p+ '\n';
          }

          break;
        case 'table':
          description += getTableDescription(parseTable($, child, item));
          break;
        case 'ol':
          description += parseOLComponent($, child, item);
          break;
        case 'td':
        case 'th':
        case 'dl':
        case 'dd':
        case 'dt':
          description += parseParagraph($, child, item);
          break;
        case 'ul':
          description += parseULComponent($, child, item);
          break;
        case 'form':
          //description += `この下に入力用のフォームがあります。\nフォームに入力する場合は、「詳細はこちら」を押して元ページを開いてください。`;
          break;
        case 'img':
          if(child.attribs && child.attribs.width && child.attribs.height) {
            const width = Number(child.attribs.width);
            const height = Number(child.attribs.height);

            if(width < 30 && height < 30) {
              continue;
            }
          }
          if (child.attribs.alt && child.attribs.alt !== 'pdf') {
            let src = child.attribs.src ? String(child.attribs.src) : '';

            if (isIgnoreText(src) || isIgnoreText(child.attribs.alt)) {
              continue;
            }
            if (src) {
              description +=
                '\n\nここに「' +
                child.attribs.alt +
                '」の画像があります。' +
                '\n';

              if (src.includes('http')) {
                description += src + '\n\n';
              } else if (!src.startsWith('data:image')) {
                const path = new URL(src, loadedUrl);
                description += path.href + '\n\n';
              }
            }
          } else {
            if (!child.attribs.alt) {
              let src = child.attribs.src ? String(child.attribs.src) : '';
              if (src) {
                description += '\n\nここに画像があります。\n';
                if (src.includes('http')) {
                  description += src + '\n\n';
                } else if (!src.startsWith('data:image')) {
                  const path = new URL(src, loadedUrl);
                  description += path.href + '\n\n';
                }
              }
            }
          }
          break;
        default:
          description += parseParagraph($, $(child), item);
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
      description += i + 1 + '. ' + parseParagraph($, col, item).trim() + '\n';
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
      const text = cleanText(parseParagraph($, col,item));
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
  if (
    text.includes('Acrobat') ||
    text.includes('Adobe') ||
    text.toLowerCase().includes('adobe.com/jp') ||
    text.toLowerCase().includes('function(') ||
    text.toLowerCase().includes('connect.facebook.net') ||
    text.toLowerCase().includes('facebook.com/share') ||
    text.toLowerCase().includes('javascript') ||
    text.toLowerCase().includes('line-website.com') ||
    text.toLowerCase().includes('line.me') ||
    text.toLowerCase().includes('document.write(') ||
    text.toLowerCase().includes('twitter.com') ||
    text.toLowerCase().includes('hatena')
  ) {
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
    (element.attribs.class.includes('pdf_download') ||
      element.attribs.class.includes('adobeReader') ||
      element.attribs.class.includes('adobe-reader'))
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

const extractTextFromDom = ($: any, $el: any, item: IArticle) => {
  let description = '';
  if (!$el) return '';

  // get children
  const $children = $el;
  // if there are no children, return the text
  if ($children.length === 0) {
    description += cleanText($el.text());
  } else {
    // if there are children, get the text from each child
    $children.each((i, child) => {
      description += parseParagraph($, child, item);
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
  const strHtml = $.html();
  const $clone = cheerio.load(strHtml);
  const $content = $clone(contentSector);

  if (titleEle) {
    const $titleEle = $clone(titleEle);
    $content.find('*').each((i, child) => {
      const $child = $clone(child);
      if (child.type === 'tag') {
        // loop until meet the title element
        if ($titleEle.is($child)) {
          // remove itself
          $child.remove();
          return false;
        } else {
          // if not titleEle, remove it
          $child.remove();
        }
      }

      return true;
    });
  }

  let description = cleanText(extractTextFromDom($clone, $content, item));
  description = 'ここから本文です。'+ '\n\n' + description + '\n\n' + '以上です。' ;

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
