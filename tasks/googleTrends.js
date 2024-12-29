import fs from "fs";
import path from "path";
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  for (const geo of [
    "TW", "IN", "US", "ID", "BR",
    "PK", "NG", "JP", "RU", "MX",
    "PH", "VN", "DE", "EG", "IR",
    "TR", "FR", "GB", "IT", "KR"
    // "CN" 沒有資料
  ]) {

    // GoogleTrends 根目錄資料夾
    const d_GoogleTrends = `./data/GoogleTrends/${geo}`;
    if (!fs.existsSync(d_GoogleTrends)) { fs.mkdirSync(d_GoogleTrends, { recursive: true }); }

    // 取得 GoogleTrends 歷史紀錄
    const f_history = path.join(d_GoogleTrends, "history.json");
    const history = fs.existsSync(f_history) ? JSON.parse(fs.readFileSync(f_history, "utf-8")) : {};

    // 確認 rss 資料基本路徑
    const [ year, month, day ] = new Date().toISOString().split("T")[0].split("-");
    const d_rss = path.join(d_GoogleTrends, year);
    if (!fs.existsSync(d_rss)) { fs.mkdirSync(d_rss, { recursive: true }); }
    const f_rss = path.join(d_rss, `${year}-${month}-${day}.json`);
    if (fs.existsSync(f_rss)) { continue; }

    const url = `https://trends.google.com.tw/trending/rss?geo=${geo}`;
    for (let retry = 0; retry < 3; retry++) {
      try {
        // 取得 geo, date 指定的 GoogleTrends RSS 資料
        const response = await axios.get(url);
        const json = await parseStringPromise(response.data, { explicitArray: false });
        fs.writeFileSync(f_rss, JSON.stringify(json.rss.channel.item));

        // 更新 GoogleTrends 歷史紀錄
        if (!history.hasOwnProperty(year)) { history[year] = {}; }
        if (!history[year].hasOwnProperty(month)) { history[year][month] = {}; }
        history[year][month][day] = json.rss.channel.item.length;
        fs.writeFileSync(f_history, JSON.stringify(history));

        // 完成
        break
      }
      catch (error) {
        console.error(`嘗試第 ${retry + 1} 次時發生錯誤`);
        if (error.code === "ERR_BAD_REQUEST") {
          console.error(`ERR_BAD_REQUEST 伺服器拒絕存取`, url);
        }
        else {
          console.error(error);
        }
        delay(5000);
      }
    }
  }
})();