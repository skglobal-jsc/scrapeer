export interface FormResult {
  action: string;
  method: string;
  data: Record<string, string>;
}

/**
 * this is my simple parser to parse table. It's not perfect but it works. You can improve it
 * @param $
 * @param element - table element or selector
 * @returns
 */
const parser = (
  $: cheerio.Root,
  element: cheerio.Element | string
): FormResult => {
  const $formElm = $(element);
  const action = $formElm.attr('action') || '';
  const method = $formElm.attr('method') || 'POST';
  const inputs = $formElm.find('input');
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

export default parser;
