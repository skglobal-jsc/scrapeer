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
    'https://www.city.iwaki.lg.jp/www/contents/1664238133651/index.html',
};
(() => {
  // console.log('Hello world');

  const url =
    'https://www.city.iwaki.lg.jp/www/contents/1664238133651/index.html';

  axios.get(url).then((res) => {
    const $ = cheerio.load(res.data);
    const content: any = '.article';
    const result = generateDescriptionFromDom($, mockArticle, content);

    console.log('result', result);
  });
})();
