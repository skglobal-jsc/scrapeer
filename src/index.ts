import cheerio from 'cheerio';
import { parseHref, parseImage, parseList, parseTable, parseText } from './parsers';
import { cleanText } from './parsers/utils';
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

const extractTextFromDom = (
  $: cheerio.Root,
  $el: cheerio.Cheerio,
  item: IArticle
) => {
  const { loadedUrl = '' } = item;
  let textContent = '';
  // get children
  const $children = $el.children();

  // if there are no children, return the text
  if ($children.length === 0) {
    textContent += cleanText($el.text());
  } else {
    // if there are children, get the text from each child
    $children.each((i, child) => {
      const $child = $el.children().eq(i);
      // if the child is a text node, return the text
      const tagName = $child.prop('tagName');

      switch (tagName) {
        case 'A':
          textContent += parseHref($, child, loadedUrl);
          break;

        case 'IMG':
          textContent += parseImage($, child, loadedUrl);
          break;
        case 'P':
        case 'SPAN':
          textContent += parseText($, child);
          break;

        case 'UL':
        case 'OL':
          parseList($, child);
          break;
        case 'DL':
          break;
        case 'DIV':
          textContent += extractTextFromDom($, $child, item);
          break;
        case 'TABLE':
          textContent += parseTable($, child);
          break;
        default:
          textContent += extractTextFromDom($, $child, item);
          break;
      }
    });
  }

  return textContent;
};

export const generateDescriptionFromDom = (
  $: cheerio.Root,
  item: IArticle,
  contentSector: string = 'body'
): any => {
  const $content = $(contentSector);
  let description = extractTextFromDom($, $content, item);
  description = item.title + '\n' + item.publishDate + '\n\n' + description;

  return {
    description,
  };
};
