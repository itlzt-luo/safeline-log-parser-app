const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'ip2region.xdb');
let cBuffer = null;

try {
  cBuffer = fs.readFileSync(dbPath);
  console.log("ip2region xdb loaded, size:", cBuffer.length);
} catch (e) {
  console.error("Failed to load ip2region.xdb", e);
}

function parseIP(ipStr) {
  const parts = ipStr.split('.');
  if (parts.length !== 4) return null;
  const buf = Buffer.alloc(4);
  for (let i = 0; i < 4; i++) {
    buf[i] = parseInt(parts[i], 10);
  }
  return buf;
}

const HeaderInfoLength = 256;
const VectorIndexCols = 256;
const VectorIndexSize = 8;

function searchIp(ipStr) {
  if (!cBuffer) return "";
  
  try {
    const ipBytes = parseIP(ipStr);
    if (!ipBytes) return ""; // invalid ipv4
    
    const il0 = ipBytes[0], il1 = ipBytes[1];
    const idx = il0 * VectorIndexCols * VectorIndexSize + il1 * VectorIndexSize;
    
    const sPtr = cBuffer.readUInt32LE(HeaderInfoLength + idx);
    const ePtr = cBuffer.readUInt32LE(HeaderInfoLength + idx + 4);
    
    if (sPtr === 0 || ePtr === 0) return "";
    
    const indexSize = 14; 
    let l = 0, h = Math.floor((ePtr - sPtr) / indexSize);
    let dLen = 0, dPtr = 0;
    
    // IP address as 32-bit unsigned integer
    const targetIp = ipBytes.readUInt32BE(0); 
    
    while (l <= h) {
      const m = (l + h) >> 1;
      const p = sPtr + m * indexSize;
      
      const sip = cBuffer.readUInt32LE(p);
      const eip = cBuffer.readUInt32LE(p + 4);
      
      if (targetIp < sip) {
        h = m - 1;
      } else if (targetIp > eip) {
        l = m + 1;
      } else {
        dLen = cBuffer.readUInt16LE(p + 8);
        dPtr = cBuffer.readUInt32LE(p + 10);
        break;
      }
    }
    
    if (dLen === 0) return "";
    
    return cBuffer.toString('utf8', dPtr, dPtr + dLen);
  } catch (err) {
    return "";
  }
}

function getCleanLocation(ipStr) {
  const raw = searchIp(ipStr);
  if (!raw) return '未知';
  
  // Example: 中国|广东省|深圳市|电信|CN
  const parts = raw.split('|');
  
  let country = parts[0] !== '0' ? parts[0] : '';
  let province = parts[1] !== '0' ? parts[1] : '';
  let city = parts[2] !== '0' ? parts[2] : '';
  let isp = parts[3] !== '0' ? parts[3] : '';
  
  // index 0: Country
  // index 1: Province/Region
  // index 2: City
  // index 3: ISP
  // index 4: ISO Code
  
  let loc = [];
  if (country && country !== '中国' && country !== '0') loc.push(country);
  if (province && province !== '0') loc.push(province);
  if (city && city !== province && city !== '0') loc.push(city);
  
  // If no city/province, maybe show ISP
  if (loc.length === 0 || (loc.length === 1 && loc[0] !== '中国')) {
      if (isp && isp !== '内网IP' && isp !== '0') {
          loc.push(isp);
      }
  }
  
  if (loc.length === 0) {
    const validParts = parts.filter(p => p && p !== '0');
    return validParts.length > 0 ? validParts.join('-') : '未知';
  }
  
  return loc.join('-');
}

module.exports = {
  searchIp,
  getCleanLocation
};
