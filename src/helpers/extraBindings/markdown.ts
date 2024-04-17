import json2md from 'json2md';

export const toMarkdown = (inputJson: any[]) => {
  return json2md(inputJson);
};
