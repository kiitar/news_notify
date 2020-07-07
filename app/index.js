const cheerio = require("cheerio");
const vo = require("vo");
const Nightmare = require("nightmare");
const nightmare = Nightmare({ show: false });
const cron = require("node-cron");
const LineAPI = require("line-api");
const url = "https://www.google.co.th/search?tbs=qdr:h";
const Xvfb = require("xvfb");
let xvfb = new Xvfb({
  // displayNum: 99,
  // reuse: true,
});
try {
  xvfb.startSync();
} catch (e) {
  console.log(e);
}
const moment = require("moment");
const substrings = [
  "thansettakij.com/content/",
  "thaipost.net/main/detail/",
  "innnews.co.th/politics/",
  "sanook.com/news/",
  "naewna.com/politic/",
  "siamrath.co.th/n/",
  "mgronline.com/politics/detail/",
  "mgronline.com/news1/detail/",
  "thebangkokinsight.com/",
  "prachachat.net/politics/",
  "thairath.co.th/news/politic/",
  "thairath.co.th/news/local/bangkok/",
  "matichon.co.th/article/",
  "naewna.com/business/",
  // "nationtv.tv/main/content/social/",
  // "nationtv.tv/main/content/",
  "sanook.com/covid-19/",
  "thairath.co.th/news/crime/",
  "matichon.co.th/matichon-poll/",
  "sanook.com/money/",
  "naewna.com/local/",
];
// HqbvTGnzGV96XLgOKcgP85QjGdLqneP9bBU8arvw6RR
// auotkPWb3skosWGiGaQTONk1qDm11n45DAMiAtgSp0h rtedt
let arr = [
  { token: "VDcp28ySutIZQcoSKPncROtjbVqtP4zHzKEjlmnEKKe", keyword: `พรก.ฉุกเฉิน+เคอร์ฟิว` },
  { token: "VDcp28ySutIZQcoSKPncROtjbVqtP4zHzKEjlmnEKKe", keyword: `วันเฉลิม สัตย์ศักดิ์สิทธิ์+หายตัว` },
  { token: "VDcp28ySutIZQcoSKPncROtjbVqtP4zHzKEjlmnEKKe", keyword: `#saveวันเฉลิม+#112` },
  { token: "VDcp28ySutIZQcoSKPncROtjbVqtP4zHzKEjlmnEKKe", keyword: `wanchalearm satsaksit` },
  { token: "VDcp28ySutIZQcoSKPncROtjbVqtP4zHzKEjlmnEKKe", keyword: `#whereiswanchalerm?` },
  { token: "VDcp28ySutIZQcoSKPncROtjbVqtP4zHzKEjlmnEKKe", keyword: `CPTPP` },
  { token: "VDcp28ySutIZQcoSKPncROtjbVqtP4zHzKEjlmnEKKe", keyword: `N0CPTPP` },
  { token: "VDcp28ySutIZQcoSKPncROtjbVqtP4zHzKEjlmnEKKe", keyword: `StopCPTPP` },
  { token: "VDcp28ySutIZQcoSKPncROtjbVqtP4zHzKEjlmnEKKe", keyword: `StopUPOV1991` },
];
let data = [];
var run = function* () {
  for (var i = 0; i < arr.length; i++) {
    data = [];
    let notify = new LineAPI.Notify({
      token: arr[i].token,
    });

    let getData = async (html) => {
      const $ = cheerio.load(html);

      const getContent = () => {
        $("div.g div.rc").each((row, raw_element) => {
          $(raw_element).each((i, elem) => {
            let title = $(elem).find("div a h3").text();
            let date = $(elem).find("div.s span.st span.f").text();
            let content = $(elem).find("div.s span.st").text();
            let link = $(elem).find("div a").attr("href");
            if (title) {
              data.push({
                title: title,
                date: date.replace("-", "").trim(),
                content: content,
                link: link,
              });
            }
          });
        });
      };

      await getContent();

      let results = await data.filter((value) => {
        let str = value.link;
        console.log(str);
        if (
          substrings.some((word) => {
            if (str.includes(word) === true) {
              const words = str.split(word);

              if (words[1] !== "") {
                return true;
              } else {
                return false;
              }
            }
          })
        ) {
          let message = `${moment(Date.now()).format("D/M/yyyy")}\n\n`;
          message += `Keyword : ${arr[i].keyword.replace(/[+]/g, " , ")}\nCategory : News\n\n${value.content}\n${
            value.link
          }\n\n`;
          notify.send({
            message: message,
          });
          return value;
        }
      });

      console.log(results);
      // var message = `${moment(Date.now()).format("D/M/yyyy")}\n\nKeyword : ${arr[i].keyword}\n\n`;

      // if (results.length) {
      //   results.forEach((v) => {
      //     message += `${v.content}\n${v.link}\n\n`;
      //   });
      //   notify.send({
      //     message: message,
      //   });
      // } else {
      //   console.log("no");
      // }
    };

    yield nightmare
      .goto(url)
      .wait("body")
      .type("input.gLFyf.gsfi", `${arr[i].keyword}`)
      .click("input.gNO89b")
      .wait("div#rcnt")
      .evaluate(() => document.querySelector("body").innerHTML)
      // .end()
      .then(async (response) => {
        await getData(response);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // yield nightmare.end();
};
console.log("running...");
// cron.schedule("*/1 * * * *", async () => {
cron.schedule("0 0 */4 * * *", async () => {
  console.log("running a task every 5 minutes");
  vo(run)(function (err, result) {
    if (err) throw err;
  });
});
