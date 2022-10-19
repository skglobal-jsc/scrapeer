// This file use the Jest framework to test the code in the file
// https://jestjs.io/docs/getting-started

import { generateDescriptionFromDom } from '../src/index';

import cheerio from 'cheerio';
import axios from 'axios';

const getHtml = async (url: string) => {
  const { data } = await axios.get(url);
  return data;
};

const cheerioInit = async (url: string) => {
  console.log('url', url);
  const html = await getHtml(url);
  return cheerio.load(html);
};

const item = {};

describe('generateDescriptionFromDom', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a object', async () => {
    const $: any = await cheerioInit(
      'https://www.city.fukuoka.lg.jp/nosui/seisakukikaku/umakamon-award2022.html'
    );

    // This is a sample article
    const item: any = {};
    const result = generateDescriptionFromDom($(".wb-contents")[0], item);
    expect(typeof result).toBe('object');
  });
});
