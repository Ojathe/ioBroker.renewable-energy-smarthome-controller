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
			const handler = await AverageValueHandler.build(adapter as unknown as AdapterInstance);
			const analyzer = new AnalyzerBonus(adapter as unknown as AdapterInstance, handler);

			adapter.setState(handler.powerDif.xidCurrent, props.powerDifCurrent);
			adapter.setState(handler.powerDif.xidAvg, props.powerDifAvg);
			adapter.setState(handler.powerGrid.xidAvg, props.powerGridAvg);
			return { handler, analyzer };
		};

		[XID_INGOING_BAT_SOC, XID_EEG_STATE_BONUS].forEach((testCase) => {
			it(`_ fetches ${testCase}`, async () => {
				// arrange
				const { analyzer } = await init();
				// act
				await analyzer.run();
				// assert
				expect(adapter.getStateAsync).to.be.calledWith(testCase);
			});
		});

		it('_ do not update Battery Stand of Charge', async () => {
			// arrange
			const { analyzer } = await init();
			// act
			await analyzer.run();

			//assert
		});

		describe('_ detects no bonus', () => {
			[
				{
					name: 'neutral power balance',
					props: { ...defaultProps },
					bat: 30,
				},
				{
					name: 'negative current power',
					props: { ...defaultProps, powerDifCurrent: -2 },
					bat: 30,
				},
				{
					name: 'negative current power and positive avg',
					props: { ...defaultProps, powerDifCurrent: -2, powerDifAvg: 2 },
					bat: 30,
				},
				{
					name: 'negative avg power',
					props: { ...defaultProps, powerDifAvg: -2 },
					bat: 0,
				},
				{
					name: 'negative avg power and positive current',
					props: { ...defaultProps, powerDifAvg: -2, powerDifCurrent: 2 },
					bat: 30,
				},
				{
					name: 'grid selling but low battery',
					props: { powerDifCurrent: 1, powerDifAvg: 1, powerGridAvg: 2 },
					bat: AnalyzerBonus.batChargeMinimum,
				},
				{
					name: 'grid selling but not enough for threshold',
					props: { ...defaultProps, powerGridAvg: AnalyzerBonus.sellingThreshold },
					bat: 30,
				},
			].forEach((testCase) => {
				it(`when  '${testCase.name}' setting: ${testCase.props.powerDifCurrent}kW cur,${testCase.props.powerDifAvg}kW avg,${testCase.props.powerGridAvg}kW grid, ${testCase.bat}% bat`, async () => {
					const asserts = utils.unit.createAsserts(database, adapter);

					// arrange
					const { analyzer } = await init(testCase.props);
					adapter.setState(XID_INGOING_BAT_SOC, testCase.bat);

					// act
					await analyzer.run();

					// assert
					// update bonus itself
					expect(adapter.setStateAsync).to.be.calledWith(XID_EEG_STATE_BONUS, false);
					asserts.assertStateHasValue(XID_EEG_STATE_BONUS, false);

					// do not update last bonus battery charge
					expect(adapter.setStateAsync).not.to.be.calledWith(XID_EEG_STATE_SOC_LAST_BONUS);
				});
			});
		});

		describe('detects bonus ', () => {
			[
				{
					name: 'when positive powerDif ',
					props: { ...defaultProps, powerDifCurrent: 1, powerDifAvg: 1 },
					bat: 30,
				},
				{
					name: 'when positive powerGrid ',
					props: { ...defaultProps, powerDifCurrent: 1, powerGridAvg: 1 },
					bat: 30,
				},
			].forEach((testCase) => {
				it(`when  '${testCase.name}' setting: ${testCase.props.powerDifCurrent}kW cur,${testCase.props.powerDifAvg}kW avg,${testCase.props.powerGridAvg}kW grid, ${testCase.bat}% bat`, async () => {
					const asserts = utils.unit.createAsserts(database, adapter);

					// arrange
					const { analyzer } = await init(testCase.props);
					adapter.setState(XID_INGOING_BAT_SOC, testCase.bat);

					// act
					await analyzer.run();

					// assert
					// update bonus state itself
					expect(adapter.setStateAsync).to.be.calledWith(XID_EEG_STATE_BONUS, true);
					asserts.assertStateHasValue(XID_EEG_STATE_BONUS, true);

					// update battery stand of charge
					expect(adapter.setStateAsync).to.be.calledWith(XID_EEG_STATE_SOC_LAST_BONUS, testCase.bat);
					asserts.assertStateHasValue(XID_EEG_STATE_SOC_LAST_BONUS, testCase.bat);
				});
			});
		});
	});
});
