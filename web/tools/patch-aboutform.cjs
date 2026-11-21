const fs = require('fs');
let s = fs.readFileSync('src/components/AboutForm.tsx', 'utf8');
// 去掉 AboutForm 内部的 ImageField，改用共享组件
s = s.replace(/\/\*\* 每张卡片一张图的就地上传[\s\S]*?\n\}\n\n/, '');
s = s.replace(
  "import type { AboutConfig } from '@/lib/about';",
  "import type { AboutConfig } from '@/lib/about';\nimport ImageField from '@/components/ImageField';"
);
s = s.replace("import { useActionState, useState } from 'react';", "import { useActionState, useState } from 'react';");
fs.writeFileSync('src/components/AboutForm.tsx', s, 'utf8');
console.log('aboutform patched; still has local ImageField?', s.includes('function ImageField'));
