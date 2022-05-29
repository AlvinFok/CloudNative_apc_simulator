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
    let args = {
      thickness: fakeThickness,
      tFactor: fakeTFactor,
      moisture: fakeMoisture,
      mFactor: fakeMFactor
    };

    let strategy = strategyOfType('SHARON');
    expect(strategy(args)).toStrictEqual({
      period: 20,
      temperature: (fakeThickness * fakeTFactor).toFixed(2),
    });

    strategy = strategyOfType('RIB_EYE');
    expect(strategy(args)).toStrictEqual({
      period: (fakeMoisture * fakeMFactor).toFixed(2),
      temperature: 100,
    });

    strategy = strategyOfType('FILET');
    expect(strategy(args)).toStrictEqual({
      period: (fakeMoisture * fakeMFactor).toFixed(2),
      temperature: 50,
    });

    strategy = strategyOfType('NEW_YORK');
    expect(strategy(args)).toStrictEqual({
      period: (fakeMoisture * fakeMFactor).toFixed(2),
      temperature: 100,
    });

    strategy = strategyOfType('TENDER_LOIN');
    expect(strategy(args)).toStrictEqual({
      period: (fakeMoisture * fakeMFactor).toFixed(2),
      temperature: 100,
    });

    strategy = strategyOfType('CHUCK');
    expect(strategy(args)).toStrictEqual({
      period: (fakeMoisture * fakeMFactor).toFixed(2),
      temperature: (fakeThickness * 2).toFixed(2),
    });
  });
});
