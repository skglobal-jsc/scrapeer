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
    'https://kankou-iwaki.or.jp/event/51745',
};
(() => {
  // console.log('Hello world');

  const url =
    'https://kankou-iwaki.or.jp/event/51745';

  axios.get(url).then((res) => {
    const $ = cheerio.load(res.data);
    const content: any = '.commonContentBox.detailBox article';
    const result = generateDescriptionFromDom($, mockArticle, content);

    console.log('result', result);
  });
})();
