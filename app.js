const request = require('superagent')
const cheerio = require('cheerio')
const fs = require('fs-extra')
const path = require('path')

let url = 'https://www.mzitu.com/';


/**
 * 生成[n, m]随机数
 * @param {number} min
 * @param {number} max
 */

function random(min,max){
    let range = max - min
    let rand = Math.random()
    let num = min + Math.round(rand * range)
    return num;
}


// 获取 url 文件夹列表
async function  getUrl () {
    let linkArr = []
    let ret = await request.get(url);
    const $ = cheerio.load(ret.text);
    $('#pins li').each(function (i, elem) {
        let link = $(this).find('a').attr('href')
        linkArr.push(link)
    });
    return linkArr;
}

// 获取图片url 地址
async function getImg(url) {
    let ret = await request.get(url).set({'Referer': 'https://www.mzitu.com/'});
    const $ = cheerio.load(ret.text);
  // 以图集名称来分目录
  const dir = $('.main-title').text();
  let presence = true;
  console.log(`创建${dir}文件夹`);
  await fs.mkdir(path.join(__dirname, '/mm', dir), {recursive: false }, (err) => {
    if (err) {
      presence = false;
    };
  });
    const pageCount = parseInt($('.pagenavi .dots').next().text());
    for (let i = 1; i <= pageCount; i++) {
      if (!presence) { // 避免二次 加载导致的 重复下载
        return false;
      }
      let pageUrl = url + '/' + i;
      try {
        const data = await request.get(pageUrl).set({
          'Referer': 'https://www.mzitu.com/'
        });
        const _$ = cheerio.load(data.text)
        // 获取图片的真实地址
        const imgUrl = _$('.main-image img').attr('src');
        console.log(imgUrl)
        download(dir, imgUrl);
        await sleep(random(100, 200))
      } catch (err) {
        console.log(err)
      }
    }
}

// 下载图片
function download(dir, imgUrl) {
    console.log(`正在下载${imgUrl}`)
    const filename = imgUrl.split('/').pop()
    const req = request.get(imgUrl).set({ 'Referer': url });
    req.pipe(fs.createWriteStream(path.join(__dirname, 'mm', dir, filename)))
}

// sleep函数
function sleep(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve()
        }, time)
    })
};

async function init(){

    let urls = await getUrl(URL);
    for (let url of urls) {
        await getImg(url)
    }
}
init();
