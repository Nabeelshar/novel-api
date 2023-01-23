const axios = require('axios');
const cheerio = require('cheerio');
const e = require('express');
const express = require('express');

const app = express();


const baseUrl = 'https://www.novelhall.com';
const absoluteUrl = (relativeUrl) => {
    if (relativeUrl.startsWith('http')) return relativeUrl;
    return baseUrl + relativeUrl;
  };


  app.get('/novels/:page', async (req, res) => {
    try {
      const page = req.params.page;
      const response = await axios.get(`https://www.novelhall.com/all2022-${page}.html`);
      const $ = cheerio.load(response.data);
  
      const novels = [];
      
      $('li.btm a').each((i, element) => {
        const href = element.attribs.href;
        const id = href.replace(/\//g, '');  // Remove forward slashes
        const title = href
          .replace(/-/g, ' ')  // Replace hyphens with spaces
          .replace(/\d+/g, '') // Remove numbers
          .replace(/\//g, '')  // Remove forward slashes
          .trim();
        
        novels.push({
          id,
          title,
          url: absoluteUrl(href),
        });
      });
      
      
      res.json({ novels });
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });
  
  
  app.get('/search/:query', async (req, res) => {
    try {
      const query = req.params.query;
      const url = `https://www.novelhall.com/index.php?s=so&module=book&keyword=${query}`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
  
      const results = [];
  
      $('.section3 table tr td:nth-child(2) a').each((i, element) => {
        const href = element.attribs.href;
        const id = href.replace(/\//g, '');  // Remove forward slashes
        const title = href
          .replace(/-/g, ' ')  // Replace hyphens with spaces
          .replace(/\d+/g, '') // Remove numbers
          .replace(/\//g, '')  // Remove forward slashes
          .trim();
  
        results.push({
          id,
          title,
         
        });
      });
  
      res.json({ results });
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });
  


  app.get('/novel/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const url = `https://www.novelhall.com/${id}/`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
  
      const novel = {};
  
      const possibleTitle = $('.book-info h1');
      if (!possibleTitle) throw new Error('No novel title');
      novel.title = possibleTitle.text();
      const absoluteUrl = (relativeUrl) => {
          if (relativeUrl.startsWith('http')) return relativeUrl;
          return baseUrl + relativeUrl;
        };
      const possibleImage = $('div.book-img img');
      if (possibleImage) {
        novel.cover = absoluteUrl(possibleImage.attr('src'));
      }
  
      const author = $('div.book-info div.total.booktag span.blue').first();
      author.find('p').remove();
      novel.author = author.text().trim().replace('Author', '').replace(':', '');
      
      // Add summary, genre, status, and chapters
      novel.summary = $('.js-close-wrap').text().trim().replace('<<', '').replace('back', '');
      novel.genre = $('.red').text().trim();
      novel.status = $('span.blue:nth-child(3)').text().trim().replace('Status', '').replace(/\:/g, '');
      novel.chapters = [];
      $('div#morelist li').each((i, element) => {
        const chapter = {};
        const a = $(element).find('a');
        chapter.url = absoluteUrl(a.attr('href')).replace(/^.+\//, '').replace('.html', '');
        chapter.title = a.text().trim();
        novel.chapters.push(chapter);
      });
      res.json({ novel });
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });
  
  

 app.get('/novel/:id/:url', async (req, res) => {
  try {
    const id = req.params.id;
    const url = req.params.url;
    const targetUrl = `https://www.novelhall.com/${id}/${url}.html`;
    const response = await axios.get(targetUrl);
    const $ = cheerio.load(response.data);

    const chapter = {};

    chapter.title = $('h1').text();
    const contents = $('div#htmlContent.entry-content');
    contents.find('div').remove();
    chapter.content = contents.html();

    // Extract next and previous links
    const nextLink = $('.nav-single a:last-child').attr('href');
    if (nextLink) {
      chapter.next = nextLink.split('/').slice(-1)[0].replace('.html', '');
    } 
    const novelID = $('.nav-single a:nth-child(3)').attr('href');
    if (novelID) {
      chapter.index = novelID.replace(/\//g, '');
    } 
    const prevLink = $('.nav-single a:nth-child(1)').attr('href');
    if (prevLink) {
      chapter.prev = prevLink.split('/').slice(-1)[0].replace('.html', '');
    } 

    res.json({ chapter });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

  

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
