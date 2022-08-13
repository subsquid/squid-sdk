import { LogEntry, LogLevel, LogPayload } from '../api';
import chalk from 'chalk';

function getLevel(level: LogLevel) {
  switch (level) {
    case LogLevel.Debug:
      return chalk.dim(level)
    case LogLevel.Info:
    case LogLevel.Notice:
      return chalk.cyan(level)
    case LogLevel.Warning:
      return chalk.yellow(level)
    case LogLevel.Error:
    case LogLevel.Critical:
    case LogLevel.Fatal:
      return chalk.red(level)
    default:
      return chalk.dim(level)
  }
}

function getPayload(payload: LogPayload) {
  if (typeof payload === 'string') {
    return payload || ''
  }

  const { msg, ns, err, ...rest } = payload;
  const res = [
    ns ? chalk.cyan(ns) : null,
    msg,
  ];

  // log if message is empty or some additional data exists
  if(!msg || Object.keys(rest).length !== 0) {
    res.push(chalk.dim(JSON.stringify(rest)))
  }

  return res.filter(v => Boolean(v)).join(' ')
}

export function pretty(logs: LogEntry[]) {
  return logs.map(({container, timestamp, level, payload}) => {
    return `${container ? chalk.magentaBright(container)+' ' : ''}${chalk.dim(timestamp)} ${getLevel(level)} ${getPayload(payload)}`
  })
}
