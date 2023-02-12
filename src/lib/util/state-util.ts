import { RenewableEnergySmarthomeController } from '../../main';

export const getStateAsNumber = async (
	context: RenewableEnergySmarthomeController,
	xid: string,
): Promise<number | undefined> => {
	const state = await context.getStateAsync(xid);

	if (!state) {
		return undefined;
	}

	if (typeof state.val == 'number') {
		return state.val as number;
	}

	return undefined;
};

export const getStateAsBoolean = async (
	context: RenewableEnergySmarthomeController,
	xid: string,
): Promise<boolean | undefined> => {
	const state = await context.getStateAsync(xid);

	if (!state) {
		return undefined;
	}

	if (typeof state.val == 'boolean') {
		return state.val as boolean;
	}

	return undefined;
};
