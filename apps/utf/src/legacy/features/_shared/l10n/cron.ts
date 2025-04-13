export type RepetitionType = 'year' | 'month' | 'day' | 'weekday' | 'mon-fri';

export const dateToCron = (
  date: Date,
  every?: RepetitionType,
) => {
  let cron = '';

  cron = `1 ${date.getUTCMinutes()} ${date.getUTCHours()}`;

  switch (every) {
    case 'day':
      return `${cron} * * ? *`;
    case 'month':
      return `${cron} ${date.getUTCDate()} * ? *`;
    case 'weekday':
      return `${cron} ? * ${date.getUTCDay() + 1} *`;
    case 'year':
      return `${cron} ${date.getUTCDate()} ${date.getUTCMonth() + 1} ? *`;
    case 'mon-fri':
      return `${cron} * * 1-5 *`;
    default:
      return undefined;
  }
};

const repeatTypes = [undefined, undefined, undefined, 'day', 'month', 'weekday', 'year'] as const;

export const detectRepeats = (cron?: string): RepetitionType | undefined => {
  if (!cron) return undefined;

  const marks = cron.split(' ');
  const [,,, day, month, weekday, year] = marks;

  if (!isNaN(Number(weekday)) && [day, month, year].every(s => ['*', '?'].includes(s))) {
    return 'weekday';
  }

  if (!isNaN(Number(month)) && [weekday, day, year].every(s => ['*', '?'].includes(s))) {
    return 'year';
  }

  if (!isNaN(Number(day)) && [weekday, month, year].every(s => ['*', '?'].includes(s))) {
    return 'month';
  }

  if ([weekday, day, month, year].every(s => ['*', '?'].includes(s))) {
    return 'day';
  }

  if (['1-5', 'MON-FRI'].includes(weekday.toUpperCase())) {
    return 'mon-fri';
  }

  return repeatTypes[marks.indexOf('*')];
};
