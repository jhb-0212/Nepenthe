/** slug 归一化：中文标题转过来的英文交给作者填，这里只做「把不合规字符收干净」 */
export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 118);
}
