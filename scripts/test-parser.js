const logParser = require('./server/logParser');
const fs = require('fs');

console.log('测试日志解析...\n');

// 读取日志文件
const logContent = fs.readFileSync('./log.txt', 'utf-8');
const lines = logContent.split('\n').filter(line => line.trim());

console.log(`日志文件总行数: ${lines.length}\n`);

// 测试解析第一行
console.log('测试第一行:');
console.log(lines[0]);
console.log('\n解析结果:');
const parsed = logParser.parseLine(lines[0]);
console.log(JSON.stringify(parsed, null, 2));

// 解析所有日志
console.log('\n\n解析所有日志...');
const allParsed = logParser.parse(logContent);
console.log(`成功解析: ${allParsed.length} 条`);
console.log(`失败: ${lines.length - allParsed.length} 条`);

// 获取统计信息
const stats = logParser.getStatistics(allParsed);
console.log('\n统计信息:');
console.log(JSON.stringify(stats, null, 2));
