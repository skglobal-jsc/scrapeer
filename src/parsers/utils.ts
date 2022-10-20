export const cleanText = (text: string = '') => {
  const txt = text
    .replace(/  *\n/g, '\n')
    .replace(/\s+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return txt;
};
