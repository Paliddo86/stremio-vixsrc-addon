const fetch = require('node-fetch');

class VixSrcService {
  static baseUrl = 'https://vixsrc.to';

  static headers() {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15';
    return {
      'User-Agent': userAgent,
      Host: 'vixsrc.to',
      Origin: 'https://vixsrc.to',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    };
  }

  static async getJson(url) {
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`Status ${res.status} for ${url}`);
    return res.json();
  }

  static async getHtml(url) {
    const res = await fetch(url, { headers: this.headers() });
    return { status: res.status, html: await res.text() };
  }

  // Helpers ported from original extractor
  static findObjectEnd(str) {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (inString) {
        if (c === stringChar && str[i - 1] !== '\\') inString = false;
      } else {
        if (c === '"' || c === "'") {
          inString = true;
          stringChar = c;
        } else if (c === '{') {
          depth++;
        } else if (c === '}') {
          depth--;
          if (depth === 0) return i + 1;
        }
      }
    }
    return str.length;
  }

  static extractWindowObject(code, key) {
    const assignPattern = new RegExp(`window\\.${key}\\s*=\\s*{`);
    const assignMatch = assignPattern.exec(code);
    if (!assignMatch) return null;
    const startIdx = assignMatch.index + assignMatch[0].length - 1;
    const rest = code.slice(startIdx);
    const endIdx = this.findObjectEnd(rest);
    if (endIdx === 0) return null;
    return rest.slice(0, endIdx);
  }

  static extractWindowPrimitive(code, key) {
    const pattern = new RegExp(`window\\.${key}\\s*=\\s*([^;\\n]+)`);
    const match = pattern.exec(code);
    if (!match) return undefined;
    let value = match[1].trim();
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    return value.replace(/^['"]|['"]$/g, '');
  }

  static extractUrl(html) {
    const masterStr = this.extractWindowObject(html, 'masterPlaylist');
    let masterPlaylist = null;
    if (masterStr) {
      try {
        masterPlaylist = eval('(' + masterStr + ')');
      } catch (e) {
        // parsing error
        // return null to let caller handle
      }
    }

    const canPlayFHD = this.extractWindowPrimitive(html, 'canPlayFHD');

    const windowData = {};
    const regex = /window\.(\w+)\s*=\s*([^;]+);/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const key = match[1];
      if (key === 'masterPlaylist' || key === 'canPlayFHD') continue;
      let value = match[2].trim();
      try {
        if (/^[{[]/.test(value)) {
          value = eval('(' + value + ')');
        } else if (/^['"].*['"]$/.test(value)) {
          value = value.slice(1, -1);
        } else if (value === 'true' || value === 'false') {
          value = value === 'true';
        } else if (!isNaN(Number(value))) {
          value = Number(value);
        } else {
          value = value.toString();
        }
      } catch (_) {
        value = value.toString();
      }
      windowData[key] = value;
    }

    const result = {
      masterPlaylist,
      canPlayFHD,
      ...windowData,
    };

    if (!masterPlaylist || !masterPlaylist.url || !masterPlaylist.params || !masterPlaylist.params.token || !masterPlaylist.params.expires) {
      throw new Error('masterPlaylist incompleto');
    }

    return result;
  }

  static buildFinalUrl(vixParsedData) {
    const { masterPlaylist, canPlayFHD } = vixParsedData;
    if (!masterPlaylist || !masterPlaylist.url) throw new Error('Dati insufficienti');
    let url = masterPlaylist.url;
    const params = [];
    if (masterPlaylist.params && masterPlaylist.params.token) params.push(`token=${encodeURIComponent(masterPlaylist.params.token)}`);
    if (masterPlaylist.params && masterPlaylist.params.expires) params.push(`expires=${encodeURIComponent(masterPlaylist.params.expires)}`);
    if (canPlayFHD) params.push('h=1');
    if (url.includes('?')) url += '&' + params.join('&');
    else if (params.length > 0) url += '?' + params.join('&');
    return url;
  }

  static buildUrl(id) {
    return `${this.baseUrl}/api/movie/${id}`;
  }

  static buildTvShowUrl(id, seasonNumber, episodeNumber) {
    return `${this.baseUrl}/api/tv/${id}/${seasonNumber}/${episodeNumber}`;
  }

  static async getMovieUrl(id) {
    try {
      const url = this.buildUrl(id);
      let data = await this.getJson(url);
      if (!data.src) throw new Error("Field 'src' mancante nel JSON.");
      let newUrl = `${this.baseUrl}${data.src}`;
      let response;
      // loop to handle 410 like original
      do {
        response = await this.getHtml(newUrl);
        if (response.status === 410) {
          data = await this.getJson(url);
          newUrl = `${this.baseUrl}${data.src}`;
        } else if (response.status === 200) {
          break;
        } else {
          throw new Error(`Unexpected status ${response.status}`);
        }
      } while (true);

      const result = this.extractUrl(response.html);
      return this.buildFinalUrl(result);
    } catch (error) {
      throw error;
    }
  }

  static async getTvShowUrl(id, seasonNumber, episodeNumber) {
    try {
      const url = this.buildTvShowUrl(id, seasonNumber, episodeNumber);
      let data = await this.getJson(url);
      if (!data.src) throw new Error("Field 'src' mancante nel JSON.");
      let newUrl = `${this.baseUrl}${data.src}`;
      let response;
      do {
        response = await this.getHtml(newUrl);
        if (response.status === 410) {
          data = await this.getJson(url);
          newUrl = `${this.baseUrl}${data.src}`;
        } else if (response.status === 200) {
          break;
        } else {
          throw new Error(`Unexpected status ${response.status}`);
        }
      } while (true);
      const result = this.extractUrl(response.html);
      return this.buildFinalUrl(result);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = VixSrcService;
