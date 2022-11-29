import { cleanText } from './utils';

const parser = (
  $: any,
  element: any | string
): string => {
  const $element = $(element);
  // return cleanText($element.text());
  return $element.text();
};

export default parser;
