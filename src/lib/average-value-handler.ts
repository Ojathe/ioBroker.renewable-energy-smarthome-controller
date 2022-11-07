import { RenewableEnergySmarthomeController } from '../main';
import { AverageValue } from './average-value';
import {
	XID_INGOING_GRID_LOAD,
	XID_INGOING_IS_GRID_BUYING,
	XID_INGOING_PV_GENERATION,
	XID_INGOING_SOLAR_RADIATION,
	XID_INGOING_TOTAL_LOAD,
} from './dp-handler';
import { getStateAsBoolean, getStateAsNumber } from './util/state-util';

export class AverageValueHandler {
	public readonly solar: AverageValue;
	public readonly powerPv: AverageValue;
	public readonly powerDif: AverageValue;
	public readonly powerGrid: AverageValue;

	constructor(context: RenewableEnergySmarthomeController) {
		this.solar = new AverageValue(context, 'solar-radiation', {
			desc: 'Average solar radiation',
			xidSource: XID_INGOING_SOLAR_RADIATION,
			unit: 'wm²',
		});

		this.powerPv = new AverageValue(context, 'power-pv', {
			desc: 'PV generation',
			xidSource: XID_INGOING_PV_GENERATION,
			unit: 'kW',
		});

		this.powerDif = new AverageValue(context, 'power-dif', {
			desc: 'difference of energy over generation (+) and loss consumption(-)',
			async mutation(_val: number) {
				const load = await getStateAsNumber(context, XID_INGOING_TOTAL_LOAD);
				const pvPower = await getStateAsNumber(context, XID_INGOING_PV_GENERATION);

				if (!load || !pvPower) {
					return Number.NEGATIVE_INFINITY;
				}

				return pvPower - load;
			},
		});

		this.powerGrid = new AverageValue(context, 'power-grid', {
			desc: 'amount of generation(+) or buying(-) of energy',
			xidSource: XID_INGOING_GRID_LOAD,
			async mutation(val: number) {
				const isGridBuying = (await getStateAsBoolean(context, XID_INGOING_IS_GRID_BUYING)) ?? true;
				return val * (isGridBuying ? -1 : 1);
			},
		});
	}
}
