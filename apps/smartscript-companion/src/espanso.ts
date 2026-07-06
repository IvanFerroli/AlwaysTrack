export function espansoYamlFor(items: Array<{ title: string; body: string; trigger: string }>) {
  const quote = (value: string) => JSON.stringify(value);
  return `${["matches:", ...items.flatMap((item) => [`  - trigger: ${quote(item.trigger)}`, `    replace: ${quote(item.body)}`, `    label: ${quote(item.title)}`])].join("\n")}\n`;
}
