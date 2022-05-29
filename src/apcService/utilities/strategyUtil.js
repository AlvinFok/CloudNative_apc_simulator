const defaultStrategy = ({
  moisture = 0,
  mFactor = 0,
}) => {
  const period = (moisture * mFactor).toFixed(2);

  return {
    period,
    temperature: 100,
  };
};

const sharonStrategy = ({
  thickness = 0,
  tFactor = 0,
}) => {
  const temperature = (thickness * tFactor).toFixed(2);

  return {
    period: 20,
    temperature,
  };
};

const filetStrategy = ({
  moisture = 0,
  mFactor = 0,
}) => {
  const period = (moisture * mFactor).toFixed(2);

  return {
    period,
    temperature: 50,
  };
};

const strategyOfType = (type) => {
  if (type === 'SHARON') {
    return sharonStrategy;
  } else if (type === 'FILET') {
    return filetStrategy;
  }
  else {
    return defaultStrategy;
  }
}

module.exports = {
  defaultStrategy,
  sharonStrategy,
  filetStrategy,
  strategyOfType
};
