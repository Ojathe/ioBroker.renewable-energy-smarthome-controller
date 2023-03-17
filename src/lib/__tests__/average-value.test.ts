import { AdapterInstance } from '@iobroker/adapter-core';
import { utils } from '@iobroker/testing';
import { expect } from 'chai';
import { itEach } from 'mocha-it-each';
import { AverageValue } from '../average-value';

const { adapter, database } = utils.unit.createMocks({});

describe('AverageValue', () => {
	afterEach(() => {
		// The mocks keep track of all method invocations - reset them after each single test
		adapter.resetMockHistory();
		// We want to start each test with a fresh database
		database.clear();
	});

	describe('build() ', () => {
		const mockedSource = 'sourceUnderTest';
		const mockedName = 'AverageValueUnderTest';
		const mockedDesc = 'descUnderTest';
		const mockedUnit = 'unitUnderTest';

		const mockedCurrent = 'avg.AverageValueUnderTest.current';
		const mockedAvg = 'avg.AverageValueUnderTest.last-10-min';
		const mockedAvg5 = 'avg.AverageValueUnderTest.last-5-min';

		it('should initialize correctly', async () => {
			const asserts = utils.unit.createAsserts(database, adapter);

			const mutation = async (num: number) => {
				return num;
			};

			const avgValToTest = await AverageValue.build(adapter as unknown as AdapterInstance, mockedName, {
				xidSource: mockedSource,
				desc: mockedDesc,
				unit: mockedUnit,
				mutation,
			});

			expect(avgValToTest).not.to.be.undefined;

			expect(avgValToTest.xidSource).to.eq(mockedSource);
			expect(avgValToTest.name).to.eq(mockedName);
			expect(avgValToTest.desc).to.eq(mockedDesc);
			expect(avgValToTest.xidCurrent).to.eq(mockedCurrent);

			expect(avgValToTest.xidAvg).to.eq(mockedAvg);
			expect(avgValToTest.xidAvg5).to.eq(mockedAvg5);
			expect(avgValToTest.mutation).to.eq(mutation);

			asserts.assertStateHasValue(avgValToTest.xidCurrent, 0);
			asserts.assertStateHasValue(avgValToTest.xidAvg, 0);
			asserts.assertStateHasValue(avgValToTest.xidAvg5, 0);
		});

		it('should throw expection when no mutation and source are defined', async () => {
			expect(AverageValue.build(adapter as unknown as AdapterInstance, mockedName)).to.be.rejectedWith(
				`${mockedName}: Es dürfen nicht xidSource UND Mutation undefniert sein!`,
			);
		});

		itEach('should create state for ${value}', [mockedCurrent, mockedAvg, mockedAvg5], async (value: any) => {
			const asserts = utils.unit.createAsserts(database, adapter);

			const avgValToTest = await AverageValue.build(adapter as unknown as AdapterInstance, mockedName, {
				xidSource: mockedSource,
			});
			expect(avgValToTest).not.to.be.undefined;

			// assert
			expect(adapter.setObjectNotExistsAsync).to.calledWith(value);
			expect(adapter.subscribeStates).to.calledWith(value);
			expect(adapter.setStateAsync).to.calledWith(value);
			asserts.assertStateExists(value);
		});
	});
});
