import { AdapterInstance } from '@iobroker/adapter-core';

export const getStateAsNumber = async (adapter: AdapterInstance, xid: string): Promise<number | undefined> => {
	// const state = await adapter.getStateAsync(`${adapter.name}.${adapter.instance}.` + xid);
	const state = await adapter.getStateAsync(xid);

	if (!state) {
		console.debug(
			`Result is undefined: 'await adapter.getStateAsync(${adapter.name}.${adapter.instance}. + ${xid})'`,
		);
		return undefined;
	}

	if (typeof state.val !== 'number') {
		console.debug(
			`Result is not a number: 'await adapter.getStateAsync(${adapter.name}.${adapter.instance}. + ${xid})'`,
		);
		return undefined;
	}

	return state.val;
};

export const getStateAsBoolean = async (adapter: AdapterInstance, xid: string): Promise<boolean | undefined> => {
	const state = await adapter.getStateAsync(xid);

	if (!state) {
		return undefined;
	}

	if (typeof state.val == 'boolean') {
		return state.val as boolean;
	}

	return undefined;
};

export const setStateAsBoolean = async (adapter: AdapterInstance, xid: string, value: boolean): Promise<void> => {
	await adapter.setStateAsync(xid, { val: value, ack: true });
};

export const setStateAsNumber = async (adapter: AdapterInstance, xid: string, value: number): Promise<void> => {
	await adapter.setStateAsync(xid, { val: value, ack: true });
};
