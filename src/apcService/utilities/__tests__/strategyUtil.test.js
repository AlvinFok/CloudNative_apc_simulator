const { filetStrategy, sharonStrategy, defaultStrategy, chuckStrategy, strategyOfType } = require('../strategyUtil');

describe('Module strategyUtil', () => {
  const fakeThickness = 2.0;
  const fakeMoisture = 0.65;
  const fakeTFactor = 0.5;
  const fakeMFactor = 0.5;

  it('Method sharonStrategy', () => {
    const res = sharonStrategy({ thickness: fakeThickness, tFactor: fakeTFactor });

    expect(res).toStrictEqual({
      period: 20,
      temperature: (fakeThickness * fakeTFactor).toFixed(2),
    });
  });

  it('Method filetStrategy', () => {
    const res = filetStrategy({ moisture: fakeMoisture, mFactor: fakeMFactor });

    expect(res).toStrictEqual({
      period: (fakeMoisture * fakeMFactor).toFixed(2),
      temperature: 50,
    });
  });

  it('Method chuckStrategy', () => {
    const res = chuckStrategy({ moisture: fakeMoisture, mFactor: fakeMFactor, thickness: fakeThickness });

    expect(res).toStrictEqual({
      period: (fakeMoisture * fakeMFactor).toFixed(2),
      temperature: (fakeThickness * 2).toFixed(2),
    });
  });

  it('Method defaultStrategy', () => {
    const res = defaultStrategy({ moisture: fakeMoisture, mFactor: fakeMFactor });

    expect(res).toStrictEqual({
      period: (fakeMoisture * fakeMFactor).toFixed(2),
      temperature: 100,
    });
  });

  it('Method strategyOfType', () => {
    expect(strategyOfType('SHARON')).toEqual(sharonStrategy);
    expect(strategyOfType('RIB_EYE')).toEqual(defaultStrategy);
    expect(strategyOfType('FILET')).toEqual(filetStrategy);
    expect(strategyOfType('NEW_YORK')).toEqual(defaultStrategy);
    expect(strategyOfType('TENDER_LOIN')).toEqual(defaultStrategy);
    expect(strategyOfType('CHUCK')).toEqual(chuckStrategy);
  });
});
