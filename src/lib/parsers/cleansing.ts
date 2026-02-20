export function getClensingDescription(description: string): string {
  let ret = description.trim();
  const regex = /^V\d{6}[　 ](.*)/;
  const match = ret.match(regex);
  if (match) ret = match[1];
  return ret;
}
