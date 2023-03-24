import { AdapterInstance } from '@iobroker/adapter-core';
import { createObjectNum } from './dp-handler';
import { getStateAsNumber } from './util/state-util';

// TODO instance number and other values configurable
const customInflux = {
	'influxdb.0': {
		enabled: true,
		storageType: '',
		aliasId: '',
		debounceTime: 0,
		blockTime: 0,
		changesOnly: true,
		changesRelogInterval: 600,
		changesMinDelta: 0.1,
		ignoreBelowNumber: '',
		disableSkippedValueLogging: false,
		enableDebugLogs: false,
		debounce: '1000',
	},
};

// TODO instance number and other values configurable
const customHistory = {
	'history.0': {
		enabled: true,
		aliasId: '',
		debounceTime: 0,
		blockTime: 0,
		changesOnly: true,
		changesRelogInterval: 600,
		changesMinDelta: 0.1,
		ignoreBelowNumber: '',
		disableSkippedValueLogging: false,
		retention: 604800,
		customRetentionDuration: 365,
		maxLength: 960,
		enableDebugLogs: false,
		debounce: 1000,
	},
};

export class AverageValue {
	public readonly xidSource?: string;
	public readonly name: string;
	public readonly desc?: string;
	private _xidCurrent = '';
	public get xidCurrent(): string {
		return this._xidCurrent;
	}
	private _xidAvg = '';
	public get xidAvg(): string {
		return this._xidAvg;
	}
	private _xidAvg5 = '';
	public get xidAvg5(): string {
		return this._xidAvg5;
	}

	public readonly mutation?: (number: number) => Promise<number>;

	private constructor(
		private adapter: AdapterInstance,
		name: string,
		props?: { xidSource?: string; desc?: string; unit?: string; mutation?: (number: number) => Promise<number> },
	) {
		this.xidSource = props?.xidSource;
		this.name = name;
		this.desc = props?.desc;

		this.mutation = props?.mutation;

		if (!this.mutation && !this.xidSource) {
			throw new Error(`${name}: Es dürfen nicht xidSource UND Mutation undefniert sein!`);
		}
	}

	static async build(
		adapter: AdapterInstance,
		name: string,
		props?: { xidSource?: string; desc?: string; unit?: string; mutation?: (number: number) => Promise<number> },
	): Promise<AverageValue> {
		const val = new AverageValue(adapter, name, props);

		val._xidCurrent = val.createStates(adapter, 'current', { unit: props?.unit, custom: customHistory });
		val._xidAvg = val.createStates(adapter, 'last-10-min', {
			descAddon: ' der letzten 10 Minuten',
			unit: props?.unit,
			custom: customInflux,
		});

		val._xidAvg5 = val.createStates(adapter, 'last-5-min', {
			descAddon: ' der letzten 5 Minuten',
			unit: props?.unit,
		});

		return val;
	}

	private createStates(
		context: AdapterInstance,
		subItem: string,
		props?: { descAddon?: string; unit?: string; custom?: Record<string, any> },
	): string {
		const xid = `avg.${this.name}.${subItem}`;
		createObjectNum(context, xid, 0, {
			desc: `${this.desc ?? this.name} ${props?.descAddon}`,
			unit: props?.unit ?? 'kW',
			custom: props?.custom,
		});
		return xid;
	}

	public async getCurrent(): Promise<number> {
		return await this.getValue(this.xidCurrent);
	}

	public async get5Min(): Promise<number> {
		return await this.getValue(this.xidAvg5);
	}

	public async get10Min(): Promise<number> {
		return await this.getValue(this.xidAvg);
	}

	private async getValue(xid: string): Promise<number> {
		const value = await getStateAsNumber(this.adapter, xid);

		if (!value) {
			console.error(`Could not retrieve value for ${xid}`);
			return 0;
		}

		if (typeof value !== 'number') {
			console.error(`Value '${value}' for ${xid} is not a number!`);
			return 0;
		}

		return value;
	}
}
