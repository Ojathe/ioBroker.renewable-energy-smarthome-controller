import { AdapterInstance } from '@iobroker/adapter-core';
import { utils } from '@iobroker/testing';
import { expect } from 'chai';
import { itEach } from 'mocha-it-each';
import {
	addSubscriptions,
	createObjects,
	XID_EEG_STATE_BONUS,
	XID_EEG_STATE_LOSS,
	XID_EEG_STATE_OPERATION,
	XID_EEG_STATE_SOC_LAST_BONUS,
	XID_INGOING_BAT_LOAD,
	XID_INGOING_BAT_SOC,
	XID_INGOING_GRID_LOAD,
	XID_INGOING_IS_GRID_BUYING,
	XID_INGOING_PV_GENERATION,
	XID_INGOING_SOLAR_RADIATION,
	XID_INGOING_TOTAL_LOAD,
} from '../dp-handler';

const mockedPvGeneration = 'mockedPvGeneration';
const mockedTotalLoad = 'mockedTotalLoad';
const mockedBatterySoc = 'mockedBatterySoc';
const mockedSolarRadiaton = 'mockedSolarRadiation';
const mockedIsGridBuying = 'mockedIsGridBuying';
const mockedIsGridLoad = 'mockedIsGridLoad';
const mockedBatteryLoad = 'mockedBatteryLoad';

const mockedConfig: ioBroker.AdapterConfig = {
	optionUseInfluxDb: false,
	optionInstanceInfluxDb: 0,
	optionInstanceHistory: 0,
	optionEnergyManagementActive: true,
	optionSourcePvGeneration: mockedPvGeneration,
	optionSourceTotalLoad: mockedTotalLoad,
	optionSourceBatterySoc: mockedBatterySoc,
	optionSourceSolarRadiation: mockedSolarRadiaton,
	optionSourceIsGridBuying: mockedIsGridBuying,
	optionSourceIsGridLoad: mockedIsGridLoad,
	optionSourceBatteryLoad: mockedBatteryLoad,
};

const { adapter, database } = utils.unit.createMocks({});

describe('dp-handler', () => {
	afterEach(() => {
		// The mocks keep track of all method invocations - reset them after each single test
		adapter.resetMockHistory();
		// We want to start each test with a fresh database
		database.clear();
	});
	describe('create Objects', () => {
		itEach(
			'should create state for ${value}',
			[
				XID_INGOING_PV_GENERATION,
				XID_INGOING_TOTAL_LOAD,
				XID_INGOING_BAT_SOC,
				XID_INGOING_SOLAR_RADIATION,
				XID_INGOING_IS_GRID_BUYING,
				XID_INGOING_GRID_LOAD,
				XID_INGOING_BAT_LOAD,
				XID_EEG_STATE_BONUS,
				XID_EEG_STATE_LOSS,
				XID_EEG_STATE_SOC_LAST_BONUS,
				XID_EEG_STATE_OPERATION,
			],
			async (value: any) => {
				await createObjects(adapter as unknown as AdapterInstance);

				// assert
				expect(adapter.setObjectNotExistsAsync).to.calledWith(value);
				expect(adapter.subscribeStates).to.calledWith(value);
				expect(adapter.setStateAsync).to.calledWith(value);
			},
		);
	});

	describe('addSubscrptions', () => {
		itEach(
			'should create state for ${value}',
			[
				mockedPvGeneration,
				mockedTotalLoad,
				mockedBatterySoc,
				mockedSolarRadiaton,
				mockedIsGridBuying,
				mockedIsGridLoad,
				mockedBatteryLoad,
			],
			async (value: any) => {
				addSubscriptions(adapter as unknown as AdapterInstance, mockedConfig);
				expect(adapter.subscribeForeignStates).to.calledWith(value);
			},
		);
	});
});
