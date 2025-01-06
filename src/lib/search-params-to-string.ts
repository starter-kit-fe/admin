export const searchParamsString = (obj: object) => {
  const search = new URLSearchParams();
  for (const key in obj) {
    search.append(key, `${obj[key as keyof typeof obj]}`);
  }
  return search.toString();
};
