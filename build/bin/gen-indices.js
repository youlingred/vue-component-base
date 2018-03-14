//序列化组件文档内容,上传到https://www.algolia.com云搜索,用于组件文档搜索功能
'use strict';

const fs = require('fs');
const dir = require('../utils/dir').rootof
const path = require('path');
const algoliasearch = require('algoliasearch');
const slugify = require('transliteration').slugify;
const key = require('./algolia-key');

const client = algoliasearch('6IDLWGB5ZQ', key);
const indexName = 'tydic-vue-component-base';

const index = client.initIndex(indexName);
index.clearIndex(err => {
  if (err) return;
  fs.readdir(dir('doc/mds'), (err, files) => {
    if (err) return;
    let indices = [];
    files.forEach(file => {
      const component = file.replace('.md', '');
      const content = fs.readFileSync(dir(`doc/mds/${ file }`), 'utf8');
      const matches = content
        .replace(/:::[\s\S]*?:::/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .match(/#{2,4}[^#]*/g)
        .map(match => match.replace(/\n+/g, '\n').split('\n').filter(part => !!part))
        .map(match => {
          const length = match.length;
          if (length > 2) {
            const desc = match.slice(1, length).join('');
            return [match[0], desc];
          }
          return match;
        });

      indices = indices.concat(matches.map(match => {
        const isComponent = match[0].indexOf('###') < 0;
        const title = match[0].replace(/#{2,4}/, '').trim();
        const index = {component, title};
        index.ranking = isComponent ? 2 : 1;
        index.anchor = slugify(title);
        index.content = (match[1] || title).replace(/<[^>]+>/g, '');
        return index;
      }));
    });

    index.addObjects(indices, (err, res) => {
      console.log(err, res);
    });
  });
});
