import { RenewableEnergySmarthomeController } from '../main';
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
	public readonly xidCurrent: string;
	public readonly xidAvg: string;
	public readonly xidAvg5: string;

	public readonly mutation?: (number: number) => Promise<number>;

	constructor(
		private adapter: RenewableEnergySmarthomeController,
		name: string,
		props?: { xidSource?: string; desc?: string; unit?: string; mutation?: (number: number) => Promise<number> },
	) {
		this.xidSource = props?.xidSource;
		this.name = name;
		this.desc = props?.desc;

		this.xidCurrent = this.createStates(adapter, 'current', { unit: props?.unit, custom: customHistory });
		this.xidAvg = this.createStates(adapter, 'last-10-min', {
			descAddon: ' der letzten 10 Minuten',
			unit: props?.unit,
			custom: customInflux,
		});

		this.xidAvg5 = this.createStates(adapter, 'last-5-min', {
			descAddon: ' der letzten 5 Minuten',
			unit: props?.unit,
		});

		this.mutation = props?.mutation;

		console.log(this.name + ' this.xidSource: ' + this.xidSource);
		console.log(this.name + ' this.mutation: ' + this.mutation);

		if (!this.mutation && !this.xidSource) {
			throw new Error(`${name}: Es dürfen nicht xidSource UND Mutation undefniert sein!`);
		}
	}

	private createStates(
		context: RenewableEnergySmarthomeController,
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
