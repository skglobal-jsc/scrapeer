import axios from 'axios';
import cheerio from 'cheerio';
import { generateDescriptionFromDom } from './src/index';

const mockArticle = {
  id: 'test',
  title: 'test',
  URL: 'test',
  crawledAt: new Date().toISOString(),
  publishDate: new Date().toISOString(),
  description: 'test',
  loadedUrl:
    'https://www.city.fukuoka.lg.jp/hofuku/hokenyobo/health/kansen/nCorV.html',
};
(() => {
  // console.log('Hello world');

  const url =
    'https://www.city.fukuoka.lg.jp/hofuku/hokenyobo/health/kansen/nCorV.html';

  axios.get(url).then((res) => {
    const $ = cheerio.load(res.data);
    const content: any = '.wb-contents';
    const result = generateDescriptionFromDom($, mockArticle, content);

    console.log('result', result);
  });
})();
