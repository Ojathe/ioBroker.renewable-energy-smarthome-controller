import { AdapterInstance } from '@iobroker/adapter-core';
import { utils } from '@iobroker/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { AverageValue } from '../average-value';
import { AverageValueHandler, calculateAverageValue } from '../average-value-handler';
import { XID_INGOING_BAT_LOAD, XID_INGOING_PV_GENERATION, XID_INGOING_SOLAR_RADIATION } from '../dp-handler';

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
		const initBuildStub = (sandbox: sinon.SinonSandbox) => {
			return sandbox.stub(AverageValue, 'build').returns('mock' as unknown as Promise<AverageValue>);
		};

		it('should create avg-value for solar-radiation ', async () => {
			// Arrange & Act
			const avgValueStub = initBuildStub(sandbox);
			const handler = await initHandler();

			//Assert
			expect(handler).not.to.be.undefined;
			expect(avgValueStub).to.be.calledWith(adapter, 'solar-radiation', {
				desc: 'Average solar radiation',
				xidSource: XID_INGOING_SOLAR_RADIATION,
				unit: 'wm²',
			});
		});

		it('should create avg-value for power-pv ', async () => {
			// Arrange & Act
			const avgValueStub = initBuildStub(sandbox);
			const handler = await initHandler();

			//Assert
			expect(handler).not.to.be.undefined;
			expect(avgValueStub).to.be.calledWith(adapter, 'power-pv', {
				desc: 'PV generation',
				xidSource: XID_INGOING_PV_GENERATION,
				unit: 'kW',
			});
		});

		it('should create avg-value for bat-load ', async () => {
			// Arrange & Act
			const avgValueStub = initBuildStub(sandbox);
			const handler = await initHandler();

			//Assert
			expect(handler).not.to.be.undefined;
			expect(avgValueStub).to.be.calledWith(adapter, 'bat-load', {
				desc: 'The Battery load (-) consuming / (+) charging',
				xidSource: XID_INGOING_BAT_LOAD,
				unit: 'kW',
			});
		});

		it('should create avg-value for power-dif ', async () => {
			// Arrange & Act
			const avgValueStub = initBuildStub(sandbox);
			const handler = await initHandler();

			//Assert
			expect(handler).not.to.be.undefined;
			expect(avgValueStub).to.be.calledWith(adapter, 'power-dif');
		});

		it('should create avg-value for power-grid ', async () => {
			// Arrange & Act
			const stub = initBuildStub(sandbox);
			const handler = await initHandler();

			expect(handler).not.to.be.undefined;
			expect(stub).to.be.calledWith(adapter, 'power-grid');
		});
	});

	describe('calculate()', () => {
		it('should call sendTo (history) 8 times', async () => {
			//Arrange
			const handler = await initHandler();

			//Act
			await handler.calculate();

			//Assert
			expect(adapter.sendTo).to.be.callCount(8);
		});

		it('should call calculateItem with powerDif', async () => {
			//Arrange
			const handler = await initHandler();

			//Act
			await handler.calculate();

			//Assert
			expect(adapter.sendTo).to.be.calledWith('history.0', 'getHistory');
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
	});
});
