class DateUtility extends Date {
  ShiftYear (shift: number) {
    if (!isNaN(shift)) {
      this.setFullYear(this.getFullYear() + shift);
    }
    return this;
  };
  ShiftMonth(shift: number) {
    if (!isNaN(shift)) {
      this.setMonth(this.getMonth() + shift);
    }
    return this;
  };
  ShiftDay(shift: number) {
    if (!isNaN(shift)) {
      this.setDate(this.getDate() + shift);
    }
    return this;
  };
  ShiftHour(shift: number) {
    if (!isNaN(shift)) {
      this.setHours(this.getHours() + shift);
    }
    return this;
  };
  ShiftMinutes(shift: number) {
    if (!isNaN(shift)) {
      this.setMinutes(this.getMinutes() + shift);
    }
    return this;
  };
  SetTime(str: string) {
    let [h, m, s] = str.split(':').map(one => {
      try {
        return parseInt(one);
      }
      catch(e) {
        return 0;
      }
    });
    if (!Number.isInteger(h)) { h = 0; }
    if (!Number.isInteger(m)) { m = 0; }
    if (!Number.isInteger(s)) { s = 0; }
    this.setHours(h);
    this.setMinutes(m);
    this.setSeconds(s);
    return this;
  }
  Format(fmt: string) {
    const weekday = ['日', '一', '二', '三', '四', '五', '六'];
    let o = {
      "M+": this.getMonth() + 1,  // 月
      "d+": this.getDate(),       // 日
      "h+": this.getHours(),      // 時
      "m+": this.getMinutes(),    // 分
      "s+": this.getSeconds(),    // 秒 
      "q+": Math.floor((this.getMonth() + 3) / 3),  // 季
      "S": this.getMilliseconds(), // 毫秒
      "W": weekday[this.getDay()]
    };
    if (/(y+)/.test(fmt)) { 
      fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      }
    }
    return fmt;
  };
  PreviousDayOfWeek(days: number) {
    this.setSeconds(0);
    this.setMinutes(0);
    this.setHours(0);
    if (!isNaN(days)) {
      if (this.getDay() == 0) {
        return this.ShiftDay(days-7);
      }
      else {
        if (this.getDay() > days) {
          return this.ShiftDay(days-this.getDay());
        }
        else if (this.getDay() < days) {
          return this.ShiftDay(days-this.getDay()-7);
        }
        else {
          return this.ShiftDay(-7);
        }
      }
    }
    return this;
  };
  NextDayOfWeek(days: number) {
    this.setSeconds(0);
    this.setMinutes(0);
    this.setHours(0);
    if (!isNaN(days)) {
      if (days == 0) {
        return this.ShiftDay(7-this.getDay());
      }
      else {
        if (this.getDay() > days) {
          return this.ShiftDay(days-this.getDay()+7);
        }
        else if (this.getDay() < days) {
          return this.ShiftDay(days-this.getDay());
        }
        else {
          return this.ShiftDay(7);
        }
      }
      
    }
    return this;
  };
  PreviousWeek(beginDay: number) {
    this.setSeconds(0);
    this.setMinutes(0);
    this.setHours(0);
    if (!isNaN(beginDay)) {
      if (this.getDay() == beginDay) {
        return [new DateUtility(this).PreviousDayOfWeek(beginDay), this];
      }
      else if (this.getDay() > beginDay) {
        return [new DateUtility(this).PreviousDayOfWeek(beginDay).PreviousDayOfWeek(beginDay), new DateUtility(this).PreviousDayOfWeek(beginDay)];
      }
      else if (this.getDay() < beginDay) {
        return [new DateUtility(this).PreviousDayOfWeek(beginDay).PreviousDayOfWeek(beginDay), new DateUtility(this).PreviousDayOfWeek(beginDay)];
      }
    }
    return this.PreviousWeek(1);
  }
}

class NumberUtility extends Number {
  ms2DateTime() {
    let ms = this as unknown as number;

    let seconds = Math.floor(ms / 1000);
    ms -= seconds * 1000;

    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    let hours = Math.floor(minutes / 60);
    minutes -= hours * 60;

    let days = Math.floor(hours / 24);
    hours -= days * 24;

    if (days > 0) {
      return `${days} 天 ${hours} 時 ${minutes} 分 ${seconds} 秒`;
    }
    else if (hours > 0) {
      return `${hours} 時 ${minutes} 分 ${seconds} 秒`;
    }
    else if (minutes > 0) {
      return `${minutes} 分 ${seconds} 秒`;
    }
    else if (seconds > 0) {
      return `${seconds} 秒 ${ms} 毫秒`;
    }
    else {
      return `${ms} 毫秒`;
    }
  }
  withCommas() {
    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }
}

class TelUtility extends String {
  // 參考資料： https://zh.wikipedia.org/wiki/%E4%B8%AD%E8%8F%AF%E6%B0%91%E5%9C%8B%E9%9B%BB%E8%A9%B1%E8%99%9F%E7%A2%BC
  removeSpecialChar() {
    let tel = this as unknown as string;
    ["#", ","].forEach(tag => {
      const tagIdx = tel.indexOf(tag);
      if (tagIdx > -1) {
        tel = tel.substr(0, tel.indexOf(tag));
      }
    });
    ["\\-", "\\(", "\\)", " "].forEach(tag => {
      tel = tel.replace(new RegExp(tag), '');
    });
    return tel;
  }
  isNormalFormat() {
    return this.guessDistrict().length > 0;
  }
  guessDistrict() {
    let tel = this.removeSpecialChar();
    if (tel.length != 10 && tel.length != 9) { return []; }
    if (tel.indexOf("09") == 0   && tel.length == 10) { return ["手機"]; }
    if (tel.indexOf("02") == 0   && tel.length == 10) { return ["臺北市","新北市","基隆市","桃園市龜山區迴龍"]; }
    if (tel.indexOf("037") == 0  && tel.length ==  9) { return ["苗栗縣","新竹縣峨眉鄉"]; }
    if (tel.indexOf("03") == 0   && tel.length ==  9) { return ["桃園市","新竹市","新竹縣","花蓮縣","宜蘭縣"]; }
    if (tel.indexOf("049") == 0  && tel.length == 10) { return ["南投縣","彰化縣芬園鄉","臺中市烏日區溪尾里","臺中市新社區福興里","花蓮縣秀林鄉富世村關原地區"]; }
    if (tel.indexOf("04") == 0   && tel.length == 10) { return ["臺中市","苗栗縣卓蘭鎮","南投縣仁愛鄉部分","花蓮縣秀林鄉富世村關原地區","彰化縣"]; }
    if (tel.indexOf("05") == 0   && tel.length ==  9) { return ["嘉義市","嘉義縣"]; }
    if (tel.indexOf("06") == 0   && tel.length ==  9) { return ["臺南市","澎湖縣"]; }
    if (tel.indexOf("07") == 0   && tel.length ==  9) { return ["高雄市"]; }
    if (tel.indexOf("0836") == 0 && tel.length ==  9) { return ["連江縣"]; }
    if (tel.indexOf("0826") == 0 && tel.length ==  9) { return ["金門縣烏坵鄉"]; }
    if (tel.indexOf("082") == 0  && tel.length ==  9) { return ["金門縣"]; }
    if (tel.indexOf("089") == 0  && tel.length ==  9) { return ["臺東縣"]; }
    if (tel.indexOf("08") == 0   && tel.length ==  9) { return ["屏東縣"]; }
    return [];
  }
  guessTelecom() {
    let tel = this.removeSpecialChar();
    if (tel.length != 10 && tel.length != 9) { return ""; }
    if (tel.indexOf("0255") == 0    && tel.length == 10) { return "亞太電信"; }
    if (tel.indexOf("0266") == 0    && tel.length == 10) { return "台灣固網"; }
    if (tel.indexOf("0277") == 0    && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("023800") == 0  && tel.length == 10) { return "台灣智慧光網"; }
    if (tel.indexOf("022") == 0     && tel.length == 10) { return "中華電信"; }
    if (tel.indexOf("023") == 0     && tel.length == 10) { return "中華電信"; }
    if (tel.indexOf("028") == 0     && tel.length == 10) { return "中華電信"; }
    if (tel.indexOf("0325") == 0    && tel.length == 10) { return "亞太電信"; }
    if (tel.indexOf("0326") == 0    && tel.length == 10) { return "台灣固網"; }
    if (tel.indexOf("0327") == 0    && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("0360") == 0    && tel.length == 10) { return "亞太電信"; }
    if (tel.indexOf("0361") == 0    && tel.length == 10) { return "台灣固網"; }
    if (tel.indexOf("0362") == 0    && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("03800") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("03805") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("03890") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("03900") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("03906") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("03910") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("03724") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("03728") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("03777") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("04350") == 0   && tel.length == 10) { return "亞太電信"; }
    if (tel.indexOf("04360") == 0   && tel.length == 10) { return "台灣固網"; }
    if (tel.indexOf("043610") == 0  && tel.length == 10) { return "台灣固網"; }
    if (tel.indexOf("043611") == 0  && tel.length == 10) { return "台灣固網"; }
    if (tel.indexOf("043700") == 0  && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("043701") == 0  && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("043702") == 0  && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("043703") == 0  && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("043704") == 0  && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("043705") == 0  && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("043706") == 0  && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("043707") == 0  && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("043900") == 0  && tel.length == 10) { return "大台中數位有線電視"; }
    if (tel.indexOf("043901") == 0  && tel.length == 10) { return "大台中數位有線電視"; }
    if (tel.indexOf("043902") == 0  && tel.length == 10) { return "大台中數位有線電視"; }
    if (tel.indexOf("043903") == 0  && tel.length == 10) { return "大台中數位有線電視"; }
    if (tel.indexOf("043920") == 0  && tel.length == 10) { return "大台中數位有線電視"; }
    if (tel.indexOf("043921") == 0  && tel.length == 10) { return "大台中數位有線電視"; }
    if (tel.indexOf("043922") == 0  && tel.length == 10) { return "大台中數位有線電視"; }
    if (tel.indexOf("04700") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("04701") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("04702") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("04703") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("04704") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("04705") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("04706") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("04707") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("04708") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("04709") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("04800") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("04801") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("04802") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("04803") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("04804") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("04711") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04712") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04713") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04714") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04715") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04716") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04717") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04718") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04719") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0472") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0473") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0474") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0475") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0476") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0477") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0478") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0479") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04811") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04812") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04813") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04814") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04815") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04816") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04817") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04818") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("04819") == 0   && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0482") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0483") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0484") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0485") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0486") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0487") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0488") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0489") == 0    && tel.length ==  9) { return "中華電信"; }
    if (tel.indexOf("0492") == 0    && tel.length == 10) { return "中華電信"; }
    if (tel.indexOf("049500") == 0  && tel.length == 10) { return "亞太電信"; }
    if (tel.indexOf("049600") == 0  && tel.length == 10) { return "台灣固網"; }
    if (tel.indexOf("049700") == 0  && tel.length == 10) { return "新世紀資通"; }
    if (tel.indexOf("05300") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("05310") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("05320") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("05700") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("05750") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("05770") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("06510") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("06511") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("06512") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("06513") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("06600") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("06601") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("06602") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("06700") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("06701") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("06702") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("06703") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("06950") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("06960") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("06970") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("07860") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("07861") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("07862") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("0795X") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("0796X") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("0797X") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("08800") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("08801") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("08810") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("08820") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("08821") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("08961") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("08971") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("08996") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("08250") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("08270") == 0   && tel.length ==  9) { return "新世紀資通"; }
    if (tel.indexOf("08280") == 0   && tel.length ==  9) { return "台灣固網"; }
    if (tel.indexOf("08366") == 0   && tel.length ==  9) { return "亞太電信"; }
    if (tel.indexOf("08369") == 0   && tel.length ==  9) { return "台灣固網"; }
    return "中華電信";
  }
}

export { 
  DateUtility,
  NumberUtility,
  TelUtility
};