import { readFile } from 'node:fs/promises';
import { compileScript, parse } from '@vue/compiler-sfc';

export async function load(url, context, nextLoad) {
  if (!url.endsWith('.vue')) return nextLoad(url, context);
  const source = await readFile(new URL(url), 'utf8');
  const { descriptor } = parse(source, { filename: url });
  const compiled = compileScript(descriptor, { id: url, inlineTemplate: true });
  return { format: 'module', source: compiled.content, shortCircuit: true };
}