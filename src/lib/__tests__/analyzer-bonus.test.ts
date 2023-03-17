import { AdapterInstance } from '@iobroker/adapter-core';
import { utils } from '@iobroker/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { AnalyzerBonus } from '../analyzer-bonus';
import { AverageValueHandler } from '../average-value-handler';
import { XID_EEG_STATE_BONUS, XID_EEG_STATE_SOC_LAST_BONUS, XID_INGOING_BAT_SOC } from '../dp-handler';

const { adapter, database } = utils.unit.createMocks({});

describe('analyzer-bonus', () => {
	const sandbox = sinon.createSandbox();
	afterEach(() => {
		// The mocks keep track of all method invocations - reset them after each single test
		adapter.resetMockHistory();
		// We want to start each test with a fresh database
		database.clear();
		// clear mocks
		sandbox.restore();
	});
	describe('run()', async () => {
		const defaultProps = {
			powerDifCurrent: 0,
			powerDifAvg: 0,
			powerGridAvg: 0,
		};

		const init = async (
			props: { powerDifCurrent: number; powerDifAvg: number; powerGridAvg: number } = defaultProps,
		) => {
			const handler = {
				powerDif: {
					getCurrent: sinon.stub().resolves(props.powerDifCurrent),
					get10Min: sinon.stub().resolves(props.powerDifAvg),
				},
				powerGrid: {
					get10Min: sinon.stub().resolves(props.powerGridAvg),
				},
			};
			const analyzer = new AnalyzerBonus(
				adapter as unknown as AdapterInstance,
				handler as unknown as AverageValueHandler,
			);

			return { handler, analyzer };
		};

		[
			{ name: '10 Minutes PowerDif', selector: (handler: any) => handler.powerDif.get10Min },
			{ name: 'Current PowerDif', selector: (handler: any) => handler.powerDif.getCurrent },
			{ name: '10 Minutes PowerGrid', selector: (handler: any) => handler.powerGrid.get10Min },
		].forEach((testCase) => {
			it(`_ fetches average ${testCase.name}`, async () => {
				// arrange
				const { analyzer, handler } = await init();

				// act
				await analyzer.run();
				// assert
				// expect(handler.powerDif).to.be.called;
				expect(testCase.selector(handler)).to.be.called;
			});
		});

		[XID_INGOING_BAT_SOC, XID_EEG_STATE_BONUS, XID_EEG_STATE_SOC_LAST_BONUS].forEach((testCase) => {
			it(`_ fetches ${testCase}`, async () => {
				// arrange
				const { analyzer } = await init();
				// act
				await analyzer.run();
				// assert
				expect(adapter.getStateAsync).to.be.calledWith(testCase);
			});
		});

		it('_ updates Bonus State', async () => {
			// arrange
			const { analyzer } = await init();
			// act
			await analyzer.run();

			//assert
			expect(adapter.setStateAsync).to.be.calledWith(XID_EEG_STATE_BONUS);
		});

		it('_ do not update Battery Stand of Charge', async () => {
			// arrange
			const { analyzer } = await init();
			// act
			await analyzer.run();

			//assert
			expect(adapter.setStateAsync).not.to.be.calledWith(XID_EEG_STATE_SOC_LAST_BONUS);
		});

		describe('_ detects no bonus', () => {
			[
				{
					name: 'negative power balance',
					props: { ...defaultProps },
					bat: 0,
				},
				{
					name: 'negative current power balance',
					props: { ...defaultProps, powerDifCurrent: -2 },
					bat: 0,
				},
				{
					name: 'negative current power balance',
					props: { ...defaultProps, powerDifCurrent: -2, powerDifAvg: 2 },
					bat: 0,
				},
				{ name: 'negative avg power balance', props: { ...defaultProps, powerDifAvg: -2 }, bat: 0 },
				{
					name: 'negative avg power balance',
					props: { ...defaultProps, powerDifAvg: -2, powerDifCurrent: 2 },
					bat: 0,
				},
				{
					name: 'grid selling but negative balance',
					props: { ...defaultProps, powerGridAvg: 2 },
					bat: 0,
				},
				{
					name: 'grid selling but negative balance',
					props: { ...defaultProps, powerGridAvg: 2 },
					bat: AnalyzerBonus.sellingThreshold,
				},
				{
					name: 'positive balance, empty battery and grid selling under threshold',
					props: { powerDifCurrent: 1, powerDifAvg: 1, powerGridAvg: AnalyzerBonus.sellingThreshold },
					bat: 10,
				},
			].forEach((testCase) => {
				it(`when  ${testCase.name} with ${testCase.bat}% Battery (${testCase.props.powerDifCurrent},${testCase.props.powerDifAvg},${testCase.props.powerGridAvg})`, async () => {
					const { analyzer } = await init(testCase.props);
					adapter.setState(XID_INGOING_BAT_SOC, testCase.bat);

					await analyzer.run();

					expect(adapter.setStateAsync).to.be.calledWith(XID_EEG_STATE_BONUS, false);
				});
			});
		});

		describe('detects bonus ', () => {
			[
				{
					name: 'negative power balance',
					props: { ...defaultProps },
					bat: 10,
				},
			].forEach((testCase) => {
				it(`when  ${testCase.name} with ${testCase.bat}% Battery (${testCase.props.powerDifCurrent},${testCase.props.powerDifAvg},${testCase.props.powerGridAvg})`, async () => {
					const { analyzer } = await init(testCase.props);
					adapter.setState(XID_INGOING_BAT_SOC, testCase.bat);

					await analyzer.run();

					expect(adapter.setStateAsync).to.be.calledWith(XID_EEG_STATE_BONUS, true);
				});
			});
		});

		describe('updates battery Charge last Bonus', () => {
			// it('when Bonus was detected', () => {});
			// it('when Bonus was detected and last charge is greather than current', () => {});
			// it('when no Bonus detected, but the charge is greather than last time', () => {});
		});
	});
});
