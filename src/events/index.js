import events97 from './events-97';
import events98 from './events-98'; //current
import events99 from './events-99';
import events00 from './events-00';
import events01 from './events-01';

const events = [
  ...events97,
  ...events98,
  ...events99,
  ...events00,
  ...events01
];

// eslint-disable-next-line import/no-anonymous-default-export
export default (year, month, day) => {
  return events
    .filter(
      event =>
        event[0][0] === year && event[0][1] === month && event[0][2] === day
    )
    .map(event => ({
      date: {
        year: event[0][0],
        month: event[0][1],
        day: event[0][2]
      },
      holiday: Boolean(event[1]),
      desc: event[2]
    }));
};
