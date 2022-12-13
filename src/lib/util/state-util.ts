import { RenewableEnergySmarthomeController } from '../../main';

export const getStateAsNumber = async (
	adapter: RenewableEnergySmarthomeController,
	xid: string,
): Promise<number | undefined> => {
	const state = await adapter.getStateAsync(`${adapter.name}.${adapter.instance}.` + xid);

	if (!state) {
		return undefined;
	}

	if (typeof state.val == 'number') {
		return state.val as number;
	}

	return undefined;
};

export const getStateAsBoolean = async (
	adapter: RenewableEnergySmarthomeController,
	xid: string,
): Promise<boolean | undefined> => {
	const state = await adapter.getStateAsync(xid);

	if (!state) {
		return undefined;
	}

	if (typeof state.val == 'boolean') {
		return state.val as boolean;
	}

	return undefined;
};
