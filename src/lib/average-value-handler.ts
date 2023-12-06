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
	private constructor(private adapter: AdapterInstance) {}

	private _solar: AverageValue | undefined;

	public get solar(): AverageValue {
		return this._solar!;
	}

	private _powerPv: AverageValue | undefined;

	public get powerPv(): AverageValue {
		return this._powerPv!;
	}

	private _powerDif: AverageValue | undefined;

	public get powerDif(): AverageValue {
		return this._powerDif!;
	}

	private _powerGrid: AverageValue | undefined;

	public get powerGrid(): AverageValue {
		return this._powerGrid!;
	}

	private _batLoad: AverageValue | undefined;

	public get batLoad(): AverageValue {
		return this._batLoad!;
	}

	static async build(adapter: AdapterInstance): Promise<AverageValueHandler> {
		const val = new AverageValueHandler(adapter);

		val._solar = await AverageValue.build(adapter, 'solar-radiation', {
			desc: 'Average solar radiation',
			xidSource: XID_INGOING_SOLAR_RADIATION,
			unit: 'wm²',
		});

		val._powerPv = await AverageValue.build(adapter, 'power-pv', {
			desc: 'PV generation',
			xidSource: XID_INGOING_PV_GENERATION,
			unit: 'kW',
		});

		val._batLoad = await AverageValue.build(adapter, 'bat-load', {
			desc: 'The Battery load (-) consuming / (+) charging',
			xidSource: XID_INGOING_BAT_LOAD,
			unit: 'kW',
		});

		val._powerDif = await AverageValue.build(adapter, 'power-dif', {
			desc: 'difference of energy over generation (+) and loss consumption(-)',
			async mutation(_val: number) {
				const load = await getStateAsNumber(adapter, XID_INGOING_TOTAL_LOAD);
				const pvPower = await getStateAsNumber(adapter, XID_INGOING_PV_GENERATION);

				if (!load || !pvPower) {
					return Number.NEGATIVE_INFINITY;
				}

				console.debug(
					`Calculating PowerDif Load:${load} kWh, PV-Gen: ${pvPower} kWh => Dif of ${pvPower - load}`,
				);

				return round(pvPower - load);
			},
		});

		val._powerGrid = await AverageValue.build(adapter, 'power-grid', {
			desc: 'amount of generation(+) or buying(-) of energy',
			xidSource: XID_INGOING_GRID_LOAD,
			async mutation(val: number) {
				const isGridBuying = (await getStateAsBoolean(adapter, XID_INGOING_IS_GRID_BUYING)) ?? true;
				return round(val * (isGridBuying ? -1 : 1));
			},
		});

		// TODO BatteryPower (lg-ess-home.0.user.essinfo.common.BATT.dc_power)

		return val;
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

		console.debug(`Updating Current Value (${sourceVal}) with xid: ${item.xidCurrent}`);
		await this.adapter.setStateAsync(item.xidCurrent, sourceVal);

		try {
			const end = Date.now();
			const start10Min = end - 60 * 1000 * 10;
			const start5Min = end - 60 * 1000 * 5;

			this.adapter.sendTo('history.0', 'getHistory', {
				id: `${this.adapter.name}.${this.adapter.instance}.${item.xidCurrent}`,
				options: {
					start: start10Min,
					end: end,
					aggregate: 'none',
				},
			});
			const result = await this.adapter.sendToAsync('history.0', 'getHistory', {
				id: `${this.adapter.name}.${this.adapter.instance}.${item.xidCurrent}`,
				options: {
					start: start10Min,
					end: end,
					aggregate: 'none',
				},
			});

			const values = (result as unknown as any).result as { val: number; ts: number }[];

			await this.calculateAvgValue(values, item.xidAvg);
			await this.calculateAvgValue(values, item.xidAvg5, start5Min);
		} catch (error) {
			console.error(`calculateAvgValue(${item.getCurrent}) # ${error}`);
		}
	}

	private async calculateAvgValue(
		values: { val: number; ts: number }[],
		xidTarget: string,
		startInMs = 0,
	): Promise<void> {
		values = values.filter((item) => item.val > 0 && item.ts >= startInMs);

		const { sum, count, avg } = calculateAverageValue(values);
		console.debug(`Updating Average Value ( ${avg} ) (sum: ${sum}, count: ${count}) with xid: ` + xidTarget);
		await this.adapter.setStateAsync(xidTarget, { val: avg, ack: true });
	}
}

export function calculateAverageValue(values: { val: number; ts: number }[]): {
	sum: number;
	count: number;
	avg: number;
} {
	const sum = round(values.map((item) => item.val).reduce((prev, curr) => prev + curr, 0));
	const count = values.length != 0 ? values.length : 0;
	const avg = round(sum / (count > 0 ? count : 1));

	return { sum, count, avg };
}

function round(val: number): number {
	return Math.round(val * 100) / 100;
}
