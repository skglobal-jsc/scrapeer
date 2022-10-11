import axios from 'axios';
import cheerio from 'cheerio';
import { parseTable } from './src/index';

(() => {
  console.log('Hello world');

  const url =
    'https://univoice-test.s3.ap-northeast-1.amazonaws.com/sample_original.html';
  axios.get(url).then((res) => {
    const $ = cheerio.load(res.data);
    $('table').each((i, el) => {
      console.log(parseTable($, el));
    });
  });
})();
