const defaultStrategy = ({
  moisture,
  mFactor,
}) => {
  const period = (moisture * mFactor).toFixed(2);

  return {
    period,
    temperature: 100,
  };
};

const sharonStrategy = ({
  thickness,
  tFactor,
}) => {
  const temperature = (thickness * tFactor).toFixed(2);

  return {
    period: 20,
    temperature,
  };
};

const filetStrategy = ({
  moisture,
  mFactor,
}) => {
  const period = (moisture * mFactor).toFixed(2);

  return {
    period,
    temperature: 50,
  };
};

const chuckStrategy = ({
  thickness,
  moisture,
  mFactor,
}) => {
  const period = (moisture * mFactor).toFixed(2);
  const temperature = (thickness * 2).toFixed(2);

  return {
    period,
    temperature,
  };
};

const strategyOfType = (type) => {
  if (type === 'SHARON') {
    return sharonStrategy;
  } else if (type === 'FILET') {
    return filetStrategy;
  } else if(type === 'CHUCK'){
    return chuckStrategy;
  }
  else {
    return defaultStrategy;
  }
}

module.exports = {
  defaultStrategy,
  sharonStrategy,
  filetStrategy,
  chuckStrategy,
  strategyOfType
};
