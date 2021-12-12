import * as path from 'path'
import * as fs from 'fs'

export function resource(name: string): string {
  return path.resolve(__dirname, '../resource', name)
}

export function readResource(name: string): string {
  return fs.readFileSync(resource(name), 'utf-8')
}

export function render(
  templateResource: string,
  variables: Record<string, string | number>
): string {
  let src = readResource(templateResource)
  for (const name in variables) {
    const value = variables[name]
    const regexp = new RegExp('\\{\\{' + name + '\\}\\}', 'g')
    src = src.replace(regexp, '' + value)
  }
  return src
}

export function randomInteger(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
