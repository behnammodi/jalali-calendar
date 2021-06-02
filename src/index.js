import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import VisibilitySensor from 'react-visibility-sensor';
import { throttle } from 'tlence';
import { on, emit } from 'jetemit';
import jalaali from 'jalaali-js';
import smoothscroll from 'smoothscroll-polyfill';
import { Dancer, useDancer } from 'react-dancing';
import reportWebVitals from './reportWebVitals';
import events from './events';
import moving from './utils/moving';
import './index.css';
import {
  daysOfWeek,
  monthsOfYear,
  monthsOfYearGergorian,
} from './configs/names';
import { version, name } from '../package.json';

console.log(`${name} ${version}`);

window.__jalali_calendar__ = {
  AUTHOR: 'Behnam Mohammadi <itten@live.com>',
  APP_NAME: name,
  APP_VERSION: version,
};

const gtag = window.gtag;

const WINDOW_RESIZE = 'WINDOW_RESIZE';
const YEAR_CHANGE = 'YEAR_CHANGE';
const EVENT_NONE = 'EVENT_NONE';
const EVENT_WITH_HOLIDAY = 'EVENT_WITH_HOLIDAY';
const EVENT_WITHOUT_HOLIDAY = 'EVENT_WITHOUT_HOLIDAY';
const REQUEST_DIALOG = 'REQUEST_DIALOG';
const GO_TODAY = 'GO_TODAY';

const noop = () => { };

const log = process.env.NODE_ENV === 'development' ? console.log : noop;

const today = new Date();
const { jy: jalaliYear, jm: jalaliMonth, jd: jalaliDay } = jalaali.toJalaali(
  today
);

const hasEvent = ({ year, month, day }) => {
  // [events] performance check lt < 1MS
  let event = events(year, month, day);

  if (event.length > 0)
    if (event.filter((x) => x.holiday).length > 0) return EVENT_WITH_HOLIDAY;
    else return EVENT_WITHOUT_HOLIDAY;
  else return EVENT_NONE;
};

const isEscape = (keyCode) => keyCode === 27;

const generateEmptyArray = (length) => [...new Array(length)];

const getNextMonths = ({ to, year, month }) => {
  for (var i = 0; i < to; i++) {
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return [year, month];
};

const getPreviousMonths = ({ from, year, month }) => {
  for (var i = from; i < 0; i++) {
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
  }
  return [year, month];
};

const activateDarkMode = () => {
  const rootElement = document.querySelector(':root');
  const darkTheme = {
    '--colors-text': '#cbcbcb',
    '--colors-dialog-backdoor': '#000000',
    '--colors-background-1': '#000000',
    '--colors-background-2': '#1d1d1d',
    '--colors-background-3': '#cbcbcb',
    '--colors-background-4': '#1d1d1d',
    '--colors-border-1': '#272727',
    '--colors-border-2': '#545454',
    '--colors-weekend-text-color': '#525252',
    '--colors-holiday-and-months-name': '#fe3b2c',
    '--colors-holiday-event': '#fe3b2c',
  };
  for (let key in darkTheme) {
    rootElement.style.setProperty(key, darkTheme[key]);
  }
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute('content', '#1d1d1d');

  document
    .querySelector('meta[name="msapplication-TileColor"]')
    .setAttribute('content', '#1d1d1d');
};

const activateLightMode = () => {
  const rootElement = document.querySelector(':root');
  const lightTheme = {
    '--colors-text': '#000000',
    '--colors-dialog-backdoor': '#000000',
    '--colors-background-1': '#ffffff',
    '--colors-background-2': '#f9f9f9',
    '--colors-background-3': '#cbcbcb',
    '--colors-background-4': '#ffffff',
    '--colors-border-1': '#d6d6d6',
    '--colors-border-2': '#b9b9b9',
    '--colors-weekend-text-color': '#9e9e9e',
    '--colors-holiday-and-months-name': '#fe3b2c',
    '--colors-holiday-event': '#fe3b2c',
  };
  for (let key in lightTheme) {
    rootElement.style.setProperty(key, lightTheme[key]);
  }
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute('content', '#f9f9f9');

  document
    .querySelector('meta[name="msapplication-TileColor"]')
    .setAttribute('content', '#f9f9f9');
};

const initialColorSchema = () => {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isLightMode = window.matchMedia('(prefers-color-scheme: light)')
    .matches;
  const isNotSpecified = window.matchMedia(
    '(prefers-color-scheme: no-preference)'
  ).matches;
  const hasNoSupport = !isDarkMode && !isLightMode && !isNotSpecified;

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addListener((e) => e.matches && activateDarkMode());
  window
    .matchMedia('(prefers-color-scheme: light)')
    .addListener((e) => e.matches && activateLightMode());

  if (isDarkMode) activateDarkMode();
  if (isLightMode) activateLightMode();
  if (isNotSpecified || hasNoSupport) {
    let now = new Date();
    let hour = now.getHours();
    if (hour < 5 || hour >= 18) {
      activateDarkMode();
    }
  }
};

const Header = memo(() => {
  const shouldBeShort = () => window.innerWidth < 410;

  const refYear = useRef();
  const refDays = useRef();
  const isShort = useRef(shouldBeShort());

  useEffect(() => {
    refYear.current.innerText = jalaliYear;
    on(WINDOW_RESIZE, () => {
      if (isShort.current !== shouldBeShort()) {
        isShort.current = shouldBeShort();
        [...refDays.current.children].forEach((day, index) => {
          day.innerText = daysOfWeek[index][isShort.current ? 'short' : 'name'];
        });
      }
    });
    on(YEAR_CHANGE, (year) => (refYear.current.innerText = year));
  }, []);

  return (
    <div className="header">
      <div className="header__actions">
        <button ref={refYear}></button>
      </div>
      <div className="header__days" ref={refDays}>
        {daysOfWeek.map((_day, _index) => (
          <div className="header__days__day" key={`DAY_NAME_${_index}`}>
            {_day[isShort.current ? 'short' : 'name']}
          </div>
        ))}
      </div>
    </div>
  );
});

const Event = memo(({ year, month, day }) => {
  const event = useMemo(() => hasEvent({ year, month, day }), [
    year,
    month,
    day,
  ]);
  if (event === EVENT_NONE) return null;

  if (event === EVENT_WITHOUT_HOLIDAY) return <div className="month__event" />;

  if (event === EVENT_WITH_HOLIDAY)
    return <div className="month__event--holiday" />;
});

const Day = memo(({ year, month, day, isWeekEnd, isToday }) => {
  const className = `month__day ${isWeekEnd ? 'month__day--weekend' : ''}`;
  const showEvent = () => {
    const event = events(year, month, day);
    const { gy: gYear, gm: gMonth, gd: gDay } = jalaali.toGregorian(
      year,
      month,
      day
    );
    emit(REQUEST_DIALOG, {
      open: true,
      body: (
        <div>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            مناسبت {`${day} ${monthsOfYear[month - 1].name} ${year}`}
          </span>
          <span>
            &nbsp;&nbsp;&nbsp;(&lrm;{gYear}{' '}
            {monthsOfYearGergorian[gMonth - 1].name} {gDay})
          </span>
          {event.length === 0 ? (
            <div>
              <br />
              هیچ ...
            </div>
          ) : (
            <ul>
              {event.map((item, _index) => (
                <li
                  key={`EVENT_${_index}`}
                  style={{
                    margin: '8px 0',
                    ...(item.holiday && {
                      color: 'var(--colors-holiday-event)',
                    }),
                  }}
                >
                  {item.desc}
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    });

    gtag('event', 'click_show_event', `${year}/${month}/${day}`);
  };

  return (
    <div className={className} onClick={showEvent}>
      <div {...(isToday && { className: 'month__today' })}>{day}</div>
      <Event year={year} month={month} day={day} />
    </div>
  );
});

const Month = memo(({ startDayOfWeek, monthLenght, year, month }) => {
  const monthVisible = (year) => (isVisible) =>
    isVisible && emit(YEAR_CHANGE, year);

  return (
    <VisibilitySensor onChange={monthVisible(year)}>
      <div className="month">
        <div
          className="month__name"
          style={{
            paddingRight: `calc(100% / 7 * ${startDayOfWeek})`,
          }}
        >
          {monthsOfYear[month - 1].name}
        </div>
        <div
          key="MONTH_GAP_START"
          className="month__gap"
          style={{ width: `calc(100% / 7 * ${startDayOfWeek})` }}
        />
        {generateEmptyArray(monthLenght).map((_, _index) => {
          const day = _index + 1;
          const isToday =
            jalaliYear === year && jalaliMonth === month && jalaliDay === day;
          return (
            <Day
              key={`TODAY_${year}_${month}_${day}`}
              isToday={isToday}
              isWeekEnd={(startDayOfWeek + day) % 7 === 0}
              year={year}
              month={month}
              day={day}
            />
          );
        })}
        <div
          key="MONTH_GAP_END"
          className="month__gap"
          style={{
            width: `calc(100% / 7 * ${7 - ((startDayOfWeek + monthLenght) % 7)
              })`,
          }}
        />
      </div>
    </VisibilitySensor>
  );
});

const Months = memo(() => {
  const refMonths = useRef(null);
  const countOfMountRender = 6;

  const [previousMonths, setPreviousMonths] = useState(countOfMountRender);
  const [nextMonths, setNextMonths] = useState(countOfMountRender);

  useEffect(() => {
    refMonths.current.scrollTop = [
      ...document.querySelectorAll('.app .months .month'),
    ]
      .splice(0, countOfMountRender)
      .reduce((a, b) => a + b.offsetHeight, 0);
  }, [previousMonths]);

  useEffect(() => {
    on(GO_TODAY, () => {
      document
        .querySelector('.app .months .month__today')
        .parentNode.parentNode.scrollIntoView({
          behavior: 'smooth',
        });

      gtag('event', 'click_go_today');
    });

    const fillTop = throttle(() => {
      setPreviousMonths(
        (prevPreviousMonths) => prevPreviousMonths + countOfMountRender
      );
    }, 1000);

    const fillDown = () => {
      setNextMonths((prevNextMonths) => prevNextMonths + countOfMountRender);
    };

    const shouldFillTop = (target) => {
      return target.scrollTop === 0;
    };

    const shouldFillDown = (target) => {
      return target.offsetHeight + target.scrollTop === target.scrollHeight;
    };

    refMonths.current.addEventListener('scroll', (event) => {
      const { target } = event;
      if (shouldFillTop(target)) {
        fillTop();
        return;
      }

      if (shouldFillDown(target)) {
        fillDown();
        return;
      }
    });
  }, []);

  return (
    <div className="months" ref={refMonths}>
      {generateEmptyArray(previousMonths + nextMonths).map((_, _index) => {
        _index = _index - previousMonths;

        const [year, month] =
          _index > 0
            ? getNextMonths({
              to: _index,
              year: jalaliYear,
              month: jalaliMonth,
            })
            : getPreviousMonths({
              from: _index,
              year: jalaliYear,
              month: jalaliMonth,
            });

        const monthLenght = jalaali.jalaaliMonthLength(year, month);

        return (
          <Month
            key={`MONTH_${year}_${month}`}
            startDayOfWeek={jalaali.dayOfTheWeek(year, month, 1)}
            monthLenght={monthLenght}
            year={year}
            month={month}
          />
        );
      })}
    </div>
  );
});

const Footer = memo(() => {
  const openInfo = () => {
    emit(REQUEST_DIALOG, {
      open: true,
      body: (
        <div>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Jalali Calendar
          </span>
          <ul>
            <li>نسخه {version}</li>
          </ul>
          <span>
            Behnam Mohammadi [
            <a
              href="https://github.com/behnammodi"
              rel="noopener noreferrer"
              target="_blank"
            >
              Github
            </a>
            ]
          </span>
        </div>
      ),
    });

    gtag('event', 'click_show_info');
  };

  return (
    <div className="footer">
      <button onClick={() => emit(GO_TODAY)}>امروز</button>

      <button onClick={openInfo}>!</button>
    </div>
  );
});

const Dialog = memo(() => {
  // TODO: when dialog open we have to change html background-color to white
  //       because we in iphone x in bottom display with other color
  const refDialogContainer = useRef();
  const [refDialogBackdoor, playDialogBackdoor] = useDancer({
    defaultStyle: {
      transform: 'scaleY(0)',
      opacity: 0,
    },
  });

  useEffect(() => {
    const dialogContainer = refDialogContainer.current;

    const handleEscape = (event) => {
      if (isEscape(event.keyCode)) {
        closeDialog();
        gtag('event', 'escape_close_dialog');
      }
    };

    let destroy = noop;
    on(REQUEST_DIALOG, ({ open, body }) => {
      if (open) {
        playDialogBackdoor({
          transform: 'scaleY(1)',
          opacity: 0.5,
        });
        dialogContainer.classList.add('dialog__container--enter');
        dialogContainer.innerHTML = ReactDOMServer.renderToString(body);
        window.addEventListener('keydown', handleEscape);

        destroy = moving({
          start: () => {
            dialogContainer.style.transition = 'none';
          },
          move: (diff) => {
            let { clientY } = diff;
            if (clientY < 0) clientY = 0;
            dialogContainer.style.transform = `translateY(${clientY}px) scaleY(1)`;
          },
          end: (touchStart, touchEnd) => {
            dialogContainer.style.removeProperty('transform');
            dialogContainer.style.removeProperty('transition');
            if (touchStart === null || touchEnd === null) return;
            if (touchEnd.clientY > touchStart.clientY) {
              closeDialog();
              gtag('event', 'pulling_down_close_dialog');
            }
          },
        });
      } else {
        playDialogBackdoor({
          transform: 'scaleY(0)',
          opacity: 0,
        });
        dialogContainer.classList.remove('dialog__container--enter');
        window.removeEventListener('keydown', handleEscape);
        destroy();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeDialog = () => emit(REQUEST_DIALOG, { open: false, body: null });

  const handleClickBackdoor = () => {
    closeDialog();
    gtag('event', 'click_backdoor_close_dialog');
  };

  return (
    <>
      <Dancer
        ref={refDialogBackdoor}
        className="dialog__backdoor"
        onClick={handleClickBackdoor}
      />
      <div ref={refDialogContainer} className="dialog__container"></div>
    </>
  );
});

function App() {
  smoothscroll.polyfill();
  let isSomeDialogOpen = false;
  on(REQUEST_DIALOG, ({ open }) => (isSomeDialogOpen = open));

  window.addEventListener('resize', () =>
    emit(WINDOW_RESIZE, {
      width: window.innerWidth,
      height: window.innerHeight,
    })
  );

  window.addEventListener('keydown', (event) => {
    if (isSomeDialogOpen) return;
    if (isEscape(event.keyCode)) {
      emit(GO_TODAY);
      gtag('event', 'escape_go_today');
    }
  });

  if (window.navigator.vibrate instanceof Function) {
    document.addEventListener('click', () => {
      window.navigator.vibrate(15);
    });
  }

  return (
    <div className="app">
      <Header />
      <Months />
      <Footer />
      <Dialog />
    </div>
  );
}

const boot = () => {
  window.addEventListener('error', (error) => {
    gtag('event', 'exception', error.message);
  });

  gtag('event', 'start');

  log('Run');
  initialColorSchema();
  ReactDOM.render(<App />, document.getElementById('root'));

  reportWebVitals();
};

boot();
