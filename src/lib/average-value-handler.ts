import { AdapterInstance } from '@iobroker/adapter-core';
import { AverageValue } from './average-value';
import {
	XID_INGOING_BAT_LOAD,
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
	public readonly batLoad: AverageValue;

	constructor(private adapter: AdapterInstance) {
		this.solar = new AverageValue(adapter, 'solar-radiation', {
			desc: 'Average solar radiation',
			xidSource: XID_INGOING_SOLAR_RADIATION,
			unit: 'wm²',
		});

		this.powerPv = new AverageValue(adapter, 'power-pv', {
			desc: 'PV generation',
			xidSource: XID_INGOING_PV_GENERATION,
			unit: 'kW',
		});

		this.batLoad = new AverageValue(adapter, 'bat-load', {
			desc: 'The Battery load (-) consuming / (+) charging',
			xidSource: XID_INGOING_BAT_LOAD,
			unit: 'kW',
		});

		this.powerDif = new AverageValue(adapter, 'power-dif', {
			desc: 'difference of energy over generation (+) and loss consumption(-)',
			async mutation(_val: number) {
				const load = await getStateAsNumber(adapter, XID_INGOING_TOTAL_LOAD);
				const pvPower = await getStateAsNumber(adapter, XID_INGOING_PV_GENERATION);

				if (!load || !pvPower) {
					return Number.NEGATIVE_INFINITY;
				}

				console.log(
					`Calculating PowerDif Load:${load} kWh, PV-Gen: ${pvPower} kWh => Dif of ${pvPower - load}`,
				);

				return pvPower - load;
			},
		});

		this.powerGrid = new AverageValue(adapter, 'power-grid', {
			desc: 'amount of generation(+) or buying(-) of energy',
			xidSource: XID_INGOING_GRID_LOAD,
			async mutation(val: number) {
				const isGridBuying = (await getStateAsBoolean(adapter, XID_INGOING_IS_GRID_BUYING)) ?? true;
				return val * (isGridBuying ? -1 : 1);
			},
		});

		// TODO BatteryPower (lg-ess-home.0.user.essinfo.common.BATT.dc_power)
	}

	public async calculate(): Promise<void> {
		await this.calculateItem(this.powerDif);
		await this.calculateItem(this.powerGrid);
		await this.calculateItem(this.powerPv);
		await this.calculateItem(this.solar);
	}

	private async calculateItem(item: AverageValue): Promise<void> {
		let sourceVal = 0;

		if (item.xidSource) {
			sourceVal = (await getStateAsNumber(this.adapter, item.xidSource)) ?? 0;
		}

		if (item.mutation) {
			sourceVal = await item.mutation(sourceVal);
		}

		await this.adapter.setStateAsync(item.xidCurrent, sourceVal);
		await this.calculateAvgValue(item.xidCurrent, item.xidAvg, 10);
		await this.calculateAvgValue(item.xidCurrent, item.xidAvg5, 5);
	}

	private async calculateAvgValue(xidSource: string, xidTarget: string, durationInMinutes: number): Promise<void> {
		const end = Date.now();

		//console.log(`fetching history for '${xidSource}' `);

		this.adapter.sendTo(
			'history.0',
			'getHistory',
			{
				id: `${this.adapter.name}.${this.adapter.instance}.${xidSource}`,
				options: {
					start: end - 60 * 1000 * durationInMinutes,
					end: end,
					aggregate: 'none',
				},
			},
			(callback) => {
				if (!callback) {
					console.log('The sendTo call did not respond a message');
					return;
				}

				const { result, error } = callback as unknown as {
					result: Array<{ val: number; ts: number }>;
					step: any;
					error: any;
				};

				//console.log('Deconstructed Result', result);

				if (error) {
					console.error(`calculateAvgValue(${xidSource},${xidTarget},${durationInMinutes}) # ${error}`);
					return;
				}

				const relValues = result.filter((item) => {
					return item.val > 0;
				});

				const sum = relValues.map((item) => item.val).reduce((prev, curr) => prev + curr, 0);
				const count = relValues.length != 0 ? relValues.length : 1;
				const avgVal = sum / (count > 0 ? count : 1);

				console.log(
					`'${xidSource}': Durchschnitt der letzten ${durationInMinutes} Minuten: ${sum}/${count} ${avgVal}`,
				);

				console.log(`Updating Average Value ( ${avgVal} ) with xid: ` + xidTarget);
				this.adapter.setState(xidTarget, { val: avgVal, ack: true });
			},
		);
	}
}
