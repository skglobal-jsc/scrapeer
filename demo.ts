import axios from 'axios';
import * as cheerio from 'cheerio';
import { generateDescriptionFromDom } from './src/index';
import * as stringSimilarity from 'string-similarity';

const getElementSelector = (el) => {
  if (el.attr('id')) {
    return '#' + el.attr('id');
  } else {
    const tagName = el.get(0).tagName.toLowerCase();

    if (tagName === 'body') {
      return tagName;
    }

    const siblings = el.siblings();

    // If there is only one element with this tag name, we don't need to specify the index
    if (siblings.length === 0) {
      return tagName;
    }

    // If there are multiple elements with this tag name, we need to specify the index
    const index = el.index();

    if (el.index() === 0) {
      return tagName + ':first-child';
    }
    if (el.index() === siblings.length) {
      return tagName + ':last-child';
    }

    return tagName + ':nth-child(' + (index + 1) + ')';
  }
};

const getArticleDescription = ({ $, article }) => {
  const findBreakElement = () => {
    let ele = null;

    // break element may be a <hr> or <div> with some predefined text
    const breakingTexts = [
      '本文',
      '本文ここから',
      'ページの本文です',
      'ここから本文です',
    ];
    breakingTexts.forEach((text) => {
      const el = $(`*:contains("${text}")`)
        .filter((el) => {
          return $(el).text() === text;
        })
        .first();
      if (el.length > 0) {
        // if we found the breaking text, then we can assume content of article is parent of this element
        ele = el;
      }
    });

    // it also possible that a small image but have alt text is "本文ここから" or "本文"
    // in this case, we need to find all images have alt text and check if the alt text is in the breakingTexts
    if (!ele) {
      $('body img[alt]').each((_, img) => {
        // get the alt text
        const altText = $(img).attr('alt');
        // check if the alt text is in the breakingTexts
        if (breakingTexts.includes(altText)) {
          ele = img;
          return false;
        }

        return true;
      });
    }

    return ele;
  };

  const findTitleCssPath = () => {
    let titleCssPath = null;

    // 1. we try to guess which element contains the title of the article
    $('h1, h2').each((_, el) => {
      const text = $(el).text().trim();
      const match = stringSimilarity.compareTwoStrings(article.title, text);
      if (match >= 0.6) {
        titleCssPath = $(el).getUniqueSelector();
        console.log(
          `[Title]`,
          'We found the title selector is',
          titleCssPath,
          'with match',
          match
        );
        return false;
      }

      return true;
    });

    return titleCssPath;
  };

  const findShareButtons = () => {
    let shareButton = null;
    // find all twitter/facebook share buttons
    $(
      'a[href*="twitter.com/share"], a[href*="facebook.com/share"], a[href*="twitter.com/intent/tweet"]'
    ).each((_, el) => {
      shareButton = $(el).getUniqueSelector();
      return false;
    });
    return shareButton;
  };

  const parseArticleDescription = (titleCssPath, label = 'SNS') => {
    let articleCssPath = '';
    let description = '';

    let titleElement = $(titleCssPath);
    while (true) {
      // from titleCssPath, we can find the parent element of the article
      let parentEle = $(titleElement).parent();

      // try to parse description from the parent element
      description = generateDescriptionFromDom(
        $,
        article,
        $(parentEle).getUniqueSelector(), // this is articleCssPath
        $(titleElement).getUniqueSelector() // this is titleCssPath
      );

      // remove base64 images
      description = description.replace(
        /data:image\/(png|jpg|jpeg);base64,([^"]+)/g,
        ''
      );

      // if we can find the description at a least 100 characters, then we can assume this is the article
      if (description && description.length >= 100) {
        console.log(
          'parsing description from:',
          $(parentEle).getUniqueSelector(),
          'with title:',
          $(titleCssPath).getUniqueSelector(),
          'result:',
          description
        );
        articleCssPath = parentEle.getUniqueSelector();
        break;
      }

      // if we can't find the description, then we need to find the parent of the parent
      titleElement = parentEle;
    }

    return {
      articleCssPath,
      description,
    };
  };

  let res = {
    description: '',
    articleCssPath: '',
  }; // result object

  // 1. Try to find break element first
  const breakElement = findBreakElement();
  if (breakElement) {
    // if we found the break element, then we can assume content of article is parent of this element
    res = parseArticleDescription($(breakElement), 'Break Element');
  }

  // 2. If we can't find break element, then we try to find the title of the article
  if (!res.description) {
    const titleCssPath = findTitleCssPath();
    if (titleCssPath) {
      res = parseArticleDescription($(titleCssPath), 'Title');
    }
  }

  // 3. if we can not find the title, we can get the 'id = main', 'id = content', 'id = article' element
  if (!res.description) {
    // check ids in the order of main, content, article
    const ids = ['main', 'content', 'article'];
    ids.forEach((id) => {
      const el = $(`#${id}`);
      if (el.length > 0) {
        const description = generateDescriptionFromDom($, article, $(el));
        res.description = description;
        res.articleCssPath = $(el).getUniqueSelector();
        return false;
      }

      return true;
    });
  }

  // 4. if we can not find the title, we can get description from the first h1
  if (!res.description) {
    const h1 = $('h1').first();
    if (h1.length > 0) {
      const description = generateDescriptionFromDom($, article, $(h1));
      res.description = description;
      res.articleCssPath = $(h1).getUniqueSelector();
    }
  }

  // 5. Finally, we try to parse the description from the whole page
  if (!res.description) {
    const description = generateDescriptionFromDom($, article, 'body');
    res.description = description;
    res.articleCssPath = 'body';
  }

  return res;
};
// const url = 'https://www.city.anjo.aichi.jp/manabu/seishonen/seishounennoie2.html';
//http://www.pref.kagoshima.jp/af22/20221124kagoyuiseminar.html
const url = 'https://www.city.hitachi.lg.jp/shimin/008/002/p110911.html';
const mockArticle = {
  title:
    '日立市｜令和4年12月11日執行　茨城県議会議員一般選挙における期日前投票の状況について',
  publishDate: '令和4年12月6日（火曜日）',
  author: [],
  publisher: null,
  thumbnailURL: null,
  keywords:
    '茨城県, 日立市, 市役所, ひたち, Hitachi, 選挙,日立市選挙管理員会,参議院,参議選,参院選,',
  description:
    '令和4年12月11日執行の茨城県議会議員一般選挙における期日前投票の状況についてお知らせします。',
  originalType: 'text/html',
  taskId: 'c-shinjukuku',
  gscType: 'NEWS',
  crawledAt: '2022-12-06T02:23:41.764Z',
  id: 'c-shinjukuku-aHR0cHM6Ly93d3cuY2l0eS5oaXRhY2hpLmxnLmpwL3NoaW1pbi8wMDgvMDAyL3AxMTA5MTEuaHRtbA',
  language: 'ja',
  URL: 'https://www.city.hitachi.lg.jp/shimin/008/002/p110911.html',
  loadedUrl: 'https://www.city.hitachi.lg.jp/shimin/008/002/p110911.html',
};
(async () => {
  const res = await axios.get(url, {
    insecureHTTPParser: true,
  });

  const $ = cheerio.load(res.data);

  $.prototype.getUniqueSelector = function () {
    let el = this;
    let parents = el.parents();
    if (!parents[0]) {
      // Element doesn't have any parents
      return ':root';
    }
    let selector = getElementSelector(el);
    let i = 0;
    let elementSelector;

    if (selector[0] === '#' || selector === 'body') {
      return selector;
    }

    do {
      elementSelector = getElementSelector($(parents[i]));
      selector = elementSelector + ' > ' + selector;
      i++;
    } while (i < parents.length - 1 && elementSelector[0] !== '#'); // Stop before we reach the html element parent
    return selector;
  };

  // TODO, testing
  const result = getArticleDescription({ $, article: mockArticle });
  console.log(result);
})();
