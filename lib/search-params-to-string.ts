export const searchParamsString = (obj: object) => {
  const search = new URLSearchParams();
  for (const key in obj) {
    const value = obj[key as keyof typeof obj];
    // 判断value是否为"" 0和""含义不一样
    if (value !== '') {
      search.append(key, value);
    }
  }
  return search.toString();
};
