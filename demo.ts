import axios from 'axios';
import * as cheerio from 'cheerio';
import { generateDescriptionFromDom } from './src/index';

// const url = 'https://www.city.anjo.aichi.jp/manabu/seishonen/seishounennoie2.html';
//http://www.pref.kagoshima.jp/af22/20221124kagoyuiseminar.html
const url = 'https://www.city.hitachi.lg.jp/shimin/002/006/singata.html';
const mockArticle = {
  id: 'test',
  title: 'test',
  URL: 'test',
  crawledAt: new Date().toISOString(),
  publishDate: new Date().toISOString(),
  description: 'test',
  loadedUrl: url,
};
(() => {
  // console.log('Hello world');
  //https://kankou-iwaki.or.jp/event/51384

  // const url =
  //   'https://www.city.iwaki.lg.jp/www/contents/1664953386672/index.html';

  // const url = 'https://kankou-iwaki.or.jp/event/50968';

  axios
    .get(url, {
      insecureHTTPParser: true,
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      // const content: any = '.txtbox';
      const content: any = '#honContents';
      const titleEle = '#honContents > div:nth-child(2) > div > h1:nth-child(2)';
      const result = generateDescriptionFromDom(
        $,
        mockArticle,
        content,
        titleEle
      );

      console.log(result);
    });
})();
