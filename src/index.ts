import { cleanText, getTableDescription } from './parsers/utils';

export interface IArticle {
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

const generateDescriptionFromDom = (
  $: cheerio.Root,
  item: IArticle,
  contentSector: string = 'body'
): any => {
  const $content = $(contentSector);
  let description = '';

  return {
    description,
  };
};

export { generateDescriptionFromDom };
