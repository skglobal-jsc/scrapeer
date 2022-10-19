import axios from 'axios';
import cheerio from 'cheerio';
import { parseTable, generateDescriptionFromDom } from './src/index';

(() => {
  // console.log('Hello world');

  const url =
    'https://www.city.fukuoka.lg.jp/hofuku/hokenyobo/health/kansen/nCorV.html';


  axios.get(url).then((res) => {
    const $ = cheerio.load(res.data);

    const $content: any = $(".wb-contents")[0];
    const result = generateDescriptionFromDom($content, {
      id: 'test',
      title: 'test',
      URL: 'test',
      crawledAt: new Date().toISOString(),
      publishDate: new Date().toISOString(),
      description: 'test',
    });

    console.log('result', result);
  });
})();
