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

export default initialColorSchema;