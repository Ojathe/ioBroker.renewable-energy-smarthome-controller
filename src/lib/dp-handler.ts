import { RenewableEnergySmarthomeController } from '../main';

export const XID_INGOING_PV_GENERATION = 'ingoing.pv-generation';
export const XID_INGOING_TOTAL_LOAD = 'ingoing.total-load';
export const XID_INGOING_BATTERY_SOC = 'ingoing.battery-soc';
export const XID_INGOING_SOLAR_RADIATION = 'ingoing.solar-radiation';
export const XID_INGOING_IS_GRID_BUYING = 'ingoing.is-grid-buying';
export const XID_INGOING_GRID_LOAD = 'ingoing.grid-load';

export const XID_EEG_STATE_BONUS = 'eeg-state.bonus';
export const XID_EEG_STATE_LOSS = 'eeg-state.loss';
export const XID_EEG_STATE_SOC_LAST_BONUS = 'eeg-state.soc-last-bonus';

export type AccessProps = { read: boolean; write: boolean };
export type CreateStateProps = { desc?: string; unit?: string; custom?: Record<string, any> };

async function createObject<T extends ioBroker.StateValue>(
	context: RenewableEnergySmarthomeController,
	name: string,
	typeName: ioBroker.CommonType,
	defaultValue: T,
	props?: CreateStateProps,
	accessProps: AccessProps = { read: true, write: true },
): Promise<void> {
	/*	For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
	await context.setObjectNotExistsAsync(name, {
		type: 'state',
		common: {
			name,
			type: typeName,
			role: 'indicator',
			desc: props?.desc,
			unit: props?.unit,
			read: accessProps.read,
			write: accessProps.write,
			custom: props?.custom,
		},
		native: {},
	});

	// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
	context.subscribeStates(name);
	// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
	// this.subscribeStates('lights.*');
	// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
	// this.subscribeStates('*');

	/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
	// same thing, but the value is flagged "ack"
	// ack should be always set to true if the value is received from or acknowledged from the target system
	await context.setStateAsync(name, { val: defaultValue, ack: true });
}

export async function createObjectString(
	adapter: RenewableEnergySmarthomeController,
	name: string,
	defaultValue = '',
	props?: CreateStateProps,
	accessProps?: AccessProps,
): Promise<void> {
	await createObject<string>(adapter, name, 'string', defaultValue, props, accessProps);
}

export async function createObjectBool(
	adapter: RenewableEnergySmarthomeController,
	name: string,
	defaultValue = false,
	props?: CreateStateProps,
	accessProps?: AccessProps,
): Promise<void> {
	await createObject<boolean>(adapter, name, 'string', defaultValue, props, accessProps);
}

export async function createObjectNum(
	adapter: RenewableEnergySmarthomeController,
	name: string,
	defaultValue = 0,
	props?: CreateStateProps,
	accessProps?: AccessProps,
): Promise<void> {
	await createObject<number>(adapter, name, 'number', defaultValue, props, accessProps);
}

export const createObjects = async (adapter: RenewableEnergySmarthomeController) => {
	await createObjectNum(adapter, XID_INGOING_PV_GENERATION, 0, {
		desc: 'The amount of power currently generated',
		unit: 'kWh',
	});
	await createObjectNum(adapter, XID_INGOING_TOTAL_LOAD, 0, {
		desc: 'The overall amount of currently consumend power',
		unit: 'kWh',
	});
	await createObjectNum(adapter, XID_INGOING_BATTERY_SOC, 0, {
		desc: 'The battery stand of charge',
		unit: '%',
	});
	await createObjectNum(adapter, XID_INGOING_SOLAR_RADIATION, 0, {
		desc: 'The Solar Radiation',
		unit: 'w\\m²',
	});
	await createObjectNum(adapter, XID_INGOING_GRID_LOAD, 0, {
		desc: 'The grids load',
		unit: 'kWh',
	});

	await createObjectBool(adapter, XID_INGOING_IS_GRID_BUYING, false, {
		desc: 'True, if the System is buying energy from grid (external)',
	});

	await createObjectBool(adapter, XID_EEG_STATE_BONUS, false, {
		desc: 'True, if there is more Power then used',
	});
	await createObjectBool(adapter, XID_EEG_STATE_LOSS, false, {
		desc: 'True, if there is less Power then used',
	});
	await createObjectNum(adapter, XID_EEG_STATE_SOC_LAST_BONUS, 0, {
		desc: 'Batteries SoC when the last Bonus was detected',
	});
};
