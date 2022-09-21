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
