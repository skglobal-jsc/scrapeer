import { cleanText } from './utils';

const parser = (
  $: cheerio.Root,
  element: cheerio.Element | string
): string => {
  const $element = $(element);
  // return cleanText($element.text());
  return $element.text();
};

export default parser;
