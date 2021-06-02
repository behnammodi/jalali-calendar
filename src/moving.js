const moving = ({ start, move, end }) => {
  let touchStart = null;
  let touchEnd = null;

  const handleStart = (event) => {
    touchStart = event.touches[0];
    start();
  };

  const handleMove = (event) => {
    if (touchStart === null) return;
    touchEnd = event.touches[0];
    let diff = {
      clientY: touchEnd.clientY - touchStart.clientY,
    };
    move(diff);
  };

  const handleEnd = () => {
    end(touchStart, touchEnd);
    touchStart = null;
    touchEnd = null;
  };

  window.addEventListener('touchstart', handleStart);
  window.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', handleEnd);

  const destroy = () => {
    window.removeEventListener('touchstart', handleStart);
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('touchend', handleEnd);
  };

  return destroy;
};

export default moving;
