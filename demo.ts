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
    'https://www.city.iwaki.lg.jp/www/contents/1664953386672/index.html',
};
(() => {
  // console.log('Hello world');
  //https://kankou-iwaki.or.jp/event/51384

  // const url =
  //   'https://www.city.iwaki.lg.jp/www/contents/1664953386672/index.html';

  const url =
    'https://www.city.iwaki.lg.jp/www/contents/1664953386672/index.html';

  axios.get(url).then((res) => {
    const $ = cheerio.load(res.data);
    // const content: any = '.txtbox';
    const content: any = '.txtbox';
    const result = generateDescriptionFromDom($, mockArticle, content);

    console.log('result', result);
  });
})();
