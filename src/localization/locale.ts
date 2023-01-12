const locale = (value) => ({
  Image: {
    ja: `ここに「${value}」の画像があります。`,
    en: `This image is about ${value}`,
    vi: `Đây là hình ảnh về ${value}`,
  },
  ImageNoAlt: {
    ja: `ここに画像があります。`,
    en: `There is a image`,
    vi: `Đây là một bức hình`,
  },
  StartArticle: {
    ja: `ここから本文です。`,
    en: `The content is as below`,
    vi: `Nội dung như sau đây`,
  },
  EndArticle: {
    ja: `以上です。`,
    en: `The End.`,
    vi: `Kết thúc nội dung.`,
  },
  TableCaption: {
    ja: `表のタイトルは${value}、です。`,
    en: `This table is about ${value}`,
    vi: `Dưới đây là bảng nói về ${value}`,
  },
  TableNumberRow: {
    ja: `この下に、縦${value}行`,
    en: `There are ${value} rows`,
    vi: `Có tổng cộng ${value} hàng`,
  },
  TableNumberColumn: {
    ja: `横${value}列の表があります。`,
    en: `There are ${value} column`,
    vi: `Có tổng cộng ${value} cột`,
  },
  TableEnd: {
    ja: `です。\n表の終わりです。`,
    en: `The table content ends.`,
    vi: `Kết thúc bảng`,
  },
  TableEndRAGT: {
    ja: `です。\n`,
    en: ``,
    vi: ``,
  },
  Table1stRow: {
    ja: `データの1行目、`,
    en: `The 1st row data`,
    vi: `Nội dung hàng đầu tiên`,
  },
  TableRow: {
    ja: `${value}行目、`,
    en: `Row data ${value}`,
    vi: `Nội dung hàng thứ ${value}`,
  },
  TableTitle: {
    ja: `見出し行は左から${value}です。`,
    en: `From the left, there are titles as following`,
    vi: `Từ bên trái, lần lượt có những tiêu đề như sau`,
  },
  Form: {
    ja: `この下に、フォームがあります。`,
    en: `There is a form`,
    vi: `Dưới đây có một biểu mẫu`,
  }
})

export const useLocale = (key, lang='ja', value= '') => {
  return locale(value)[key][lang]
}
