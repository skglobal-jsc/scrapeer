import { cleanText } from './utils';

const parser = (
  $: cheerio.Root,
  element: cheerio.Element | string,
  loadedUrl: string
): string => {
  const $element = $(element);
  return cleanText($element.text());
};

export default parser;
