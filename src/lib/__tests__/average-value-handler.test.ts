import { AdapterInstance } from '@iobroker/adapter-core';
import { utils } from '@iobroker/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { AverageValue } from '../average-value';
import { AverageValueHandler, calculateAverageValue } from '../average-value-handler';
import {
	XID_INGOING_BAT_LOAD,
	XID_INGOING_GRID_LOAD,
	XID_INGOING_IS_GRID_BUYING,
	XID_INGOING_PV_GENERATION,
	XID_INGOING_SOLAR_RADIATION,
	XID_INGOING_TOTAL_LOAD,
} from '../dp-handler';

const { adapter, database } = utils.unit.createMocks({});

describe('average-value.handler', () => {
	const sandbox = sinon.createSandbox();
	afterEach(() => {
		// The mocks keep track of all method invocations - reset them after each single test
		adapter.resetMockHistory();
		// We want to start each test with a fresh database
		database.clear();
		// clear mocks
		sandbox.restore();
	});

	const initHandler = async () => {
		return await AverageValueHandler.build(adapter as unknown as AdapterInstance);
	};

	describe('build()', () => {
		const testCases = [
			[
				'solar-radiation',
				{
					desc: 'Average solar radiation',
					xidSource: XID_INGOING_SOLAR_RADIATION,
					unit: 'wm²',
				},
			],
			[
				'power-pv',
				{
					desc: 'PV generation',
					xidSource: XID_INGOING_PV_GENERATION,
					unit: 'kW',
				},
			],
			[
				'bat-load',
				{
					desc: 'The Battery load (-) consuming / (+) charging',
					xidSource: XID_INGOING_BAT_LOAD,
					unit: 'kW',
				},
			],
			['power-dif'],
			['power-grid'],
		];

		testCases.forEach((testCase) => {
			it(`should create avg-value for ${testCase[0]} `, async () => {
				// Arrange & Act
				const avgValueStub = sandbox
					.stub(AverageValue, 'build')
					.returns('mock' as unknown as Promise<AverageValue>);
				const handler = await initHandler();

				//Assert
				expect(handler).not.to.be.undefined;
				expect(avgValueStub).to.be.calledWith(adapter, ...testCase);
			});
		});
	});

	describe('calculate()', () => {
		const testCases = [
			{ selector: (handler: AverageValueHandler) => handler.powerDif, name: 'powerDif' },
			{ selector: (handler: AverageValueHandler) => handler.powerGrid, name: 'powerGrid' },
			{ selector: (handler: AverageValueHandler) => handler.powerPv, name: 'powerPv' },
			{ selector: (handler: AverageValueHandler) => handler.solar, name: 'solar' },
		];

		describe('history access', async () => {
			testCases.forEach((testCase) => {
				it(`should call getHistory for ${testCase.name} current`, async () => {
					//Arrange
					const handler = await initHandler();

					//Act
					await handler.calculate();

					//Assert
					expect(adapter.sendTo).to.be.calledWithMatch('history.0', 'getHistory', {
						id: `${adapter.name}.${adapter.instance}.${testCase.selector(handler).xidCurrent}`,
					});
				});
			});
		});

		describe('current states calculation', () => {
			it('should calculate correctly for powerDif (positive)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_TOTAL_LOAD, 2);
				await adapter.setStateAsync(XID_INGOING_PV_GENERATION, 3);

				// act
				await handler.calculate();

				// assert
				expect(await handler.powerDif.getCurrent()).to.eq(1);
			});

			it('should calculate correctly for powerDif (neutral)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_TOTAL_LOAD, 2);
				await adapter.setStateAsync(XID_INGOING_PV_GENERATION, 2);

				// act
				await handler.calculate();

				// assert
				expect(await handler.powerDif.getCurrent()).to.eq(0);
			});

			it('should calculate correctly for powerDif (negative)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_TOTAL_LOAD, 3);
				await adapter.setStateAsync(XID_INGOING_PV_GENERATION, 2);

				// act
				await handler.calculate();

				// assert
				expect(await handler.powerDif.getCurrent()).to.eq(-1);
			});

			it('should calculate correctly for powerGrid (positive)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_GRID_LOAD, 2);
				await adapter.setStateAsync(XID_INGOING_IS_GRID_BUYING, false);

				// act
				await handler.calculate();

				// assert
				expect(await handler.powerGrid.getCurrent()).to.eq(2);
			});

			it('should calculate correctly for powerGrid (neutral 1)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_GRID_LOAD, 0);
				await adapter.setStateAsync(XID_INGOING_IS_GRID_BUYING, false);

				// act
				await handler.calculate();

				// assert
				expect(await handler.powerGrid.getCurrent()).to.eq(0);
			});

			it('should calculate correctly for powerGrid (neutral 2)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_GRID_LOAD, 0);
				await adapter.setStateAsync(XID_INGOING_IS_GRID_BUYING, true);

				// act
				await handler.calculate();

				// assert
				expect(await handler.powerGrid.getCurrent()).to.eq(0);
			});

			it('should calculate correctly for powerGrid (negative)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_GRID_LOAD, 2);
				await adapter.setStateAsync(XID_INGOING_IS_GRID_BUYING, true);

				// act
				await handler.calculate();

				// assert
				expect(await handler.powerGrid.getCurrent()).to.eq(-2);
			});

			it('should calculate correctly for powerPv (positive)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_PV_GENERATION, 2);

				// act
				await handler.calculate();

				// assert
				expect(await handler.powerPv.getCurrent()).to.eq(2);
			});

			it('should calculate correctly for solar (neutral)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_SOLAR_RADIATION, 0);

				// act
				await handler.calculate();

				// assert
				expect(await handler.solar.getCurrent()).to.eq(0);
			});

			it('should calculate correctly for solar (positive)', async () => {
				//arrange
				const handler = await initHandler();
				await adapter.setStateAsync(XID_INGOING_SOLAR_RADIATION, 200);

				// act
				await handler.calculate();

				// assert
				expect(await handler.solar.getCurrent()).to.eq(200);
			});
		});

		describe('state update', async () => {
			const mockedHistory = [
				{ ts: Date.now(), val: 20 },
				{ ts: Date.now() - 4 * 1000 * 60, val: 10 },
				{ ts: Date.now() - 8 * 1000 * 60, val: 5 },
			];

			testCases.forEach(async (testCase) => {
				it(`_ should call setState 3 times for ${testCase.name}`, async () => {
					//Arrange
					const handler = await initHandler();
					const avgVal = testCase.selector(handler);
					adapter.sendToAsync.resolves({ result: mockedHistory });

					//Act
					await handler.calculate();

					//Assert
					expect(adapter.setStateAsync).to.be.calledWith(avgVal.xidCurrent, { val: 0, ack: true });
					expect(adapter.setStateAsync).to.be.calledWith(avgVal.xidAvg, {
						val: Math.round(((20 + 10 + 5) / 3) * 100) / 100,
						ack: true,
					});
					expect(adapter.setStateAsync).to.be.calledWith(avgVal.xidAvg5, {
						val: Math.round(((20 + 10) / 2) * 100) / 100,
						ack: true,
					});
				});
			});
		});
	});

	describe('calculateAverageValue()', () => {
		it('should return 0 for empty list', () => {
			const result = calculateAverageValue([]);

			expect(result).not.to.be.undefined;
			expect(result.sum).to.eq(0);
			expect(result.count).to.eq(0);
			expect(result.avg).to.eq(0);
		});

		it('should calculate correctly', () => {
			const result = calculateAverageValue([
				{ ts: 1234, val: 2 },
				{ ts: 12345, val: 4 },
				{ ts: 12345, val: 6 },
			]);

			expect(result).not.to.be.undefined;
			expect(result.sum).to.eq(12);
			expect(result.count).to.eq(3);
			expect(result.avg).to.eq(4);
		});
	});
});
