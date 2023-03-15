import { AdapterInstance } from '@iobroker/adapter-core';
import { utils } from '@iobroker/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { AverageValue } from '../average-value';
import { AverageValueHandler } from '../average-value-handler';
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

	describe('build()', () => {
		it('should create avg-value for solar-radiation ', async () => {
			const avgValueStub = sandbox
				.stub(AverageValue, 'build')
				.returns('mock' as unknown as Promise<AverageValue>);
			const handler = await AverageValueHandler.build(adapter as unknown as AdapterInstance);

			expect(handler).not.to.be.undefined;
			expect(avgValueStub).to.be.calledWith(adapter, 'solar-radiation', {
				desc: 'Average solar radiation',
				xidSource: XID_INGOING_SOLAR_RADIATION,
				unit: 'wm²',
			});
		});

		it('should create avg-value for power-pv ', async () => {
			const avgValueStub = sandbox
				.stub(AverageValue, 'build')
				.returns('mock' as unknown as Promise<AverageValue>);
			const handler = await AverageValueHandler.build(adapter as unknown as AdapterInstance);

			expect(handler).not.to.be.undefined;
			expect(avgValueStub).to.be.calledWith(adapter, 'power-pv', {
				desc: 'PV generation',
				xidSource: XID_INGOING_PV_GENERATION,
				unit: 'kW',
			});
		});

		it('should create avg-value for bat-load ', async () => {
			const avgValueStub = sandbox
				.stub(AverageValue, 'build')
				.returns('mock' as unknown as Promise<AverageValue>);
			const handler = await AverageValueHandler.build(adapter as unknown as AdapterInstance);

			expect(handler).not.to.be.undefined;
			expect(avgValueStub).to.be.calledWith(adapter, 'bat-load', {
				desc: 'The Battery load (-) consuming / (+) charging',
				xidSource: XID_INGOING_BAT_LOAD,
				unit: 'kW',
			});
		});

		it('should create avg-value for power-dif ', async () => {
			const avgValueStub = sandbox
				.stub(AverageValue, 'build')
				.returns('mock' as unknown as Promise<AverageValue>);
			const handler = await AverageValueHandler.build(adapter as unknown as AdapterInstance);

			expect(handler).not.to.be.undefined;
			expect(avgValueStub).to.be.calledWith(adapter, 'power-dif');
		});

		it('should create avg-value for power-grid ', async () => {
			const avgValueStub = sandbox
				.stub(AverageValue, 'build')
				.returns('mock' as unknown as Promise<AverageValue>);
			const handler = await AverageValueHandler.build(adapter as unknown as AdapterInstance);

			expect(handler).not.to.be.undefined;
			expect(avgValueStub).to.be.calledWith(adapter, 'power-grid');
		});
	});
});
