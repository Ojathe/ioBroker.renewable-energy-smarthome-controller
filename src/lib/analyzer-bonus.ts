import { AdapterInstance } from '@iobroker/adapter-core';
import { AverageValueHandler } from './average-value-handler';
import { XID_EEG_STATE_BONUS, XID_EEG_STATE_SOC_LAST_BONUS, XID_INGOING_BAT_SOC } from './dp-handler';
import { getStateAsBoolean, getStateAsNumber } from './util/state-util';

export class AnalyzerBonus {
	// TODO move to config
	public static readonly sellingThreshold: number = 0.2;
	public static readonly bonusReportThreshold: number = 0.1;
	public static readonly batChargeMinimum: number = 10;

	constructor(private adapter: AdapterInstance, private avgValueHandler: AverageValueHandler) {}

	public async run(): Promise<void> {
		// TODO investigate on how to configure values
		// TODO PV Connection

		let powerBonus = false;

		// Energy, missing (<0) oder additionally (>0) related to the household load
		const powerDif = await this.avgValueHandler.powerDif.getCurrent();
		const powerDifAvg = await this.avgValueHandler.powerDif.get10Min();

		const gridPowerAvg = await this.avgValueHandler.powerGrid.get10Min();

		const batSoc = (await getStateAsNumber(this.adapter, XID_INGOING_BAT_SOC)) ?? 0;

		// bonus when positive power balance
		if (gridPowerAvg > AnalyzerBonus.sellingThreshold) {
			powerBonus = true;
		}

		// bonus when grid selling
		if (powerDifAvg > AnalyzerBonus.bonusReportThreshold) {
			powerBonus = true;
		}

		// no bonus, when battery is lower or the current power balance is negative
		if (batSoc <= AnalyzerBonus.batChargeMinimum || powerDif < 0) {
			powerBonus = false;
		}

		const msg = `BonusAnalysis # Bonus PowerDif=${powerDif} PowerDifAvg=${powerDifAvg} => powerBonus:${powerBonus} SOC=${batSoc}`;

		const reportedBonus = (await getStateAsBoolean(this.adapter, XID_EEG_STATE_BONUS)) ?? false;
		if (powerBonus && !reportedBonus) {
			console.log(msg + ' || STATE CHANGED');
		} else {
			console.debug(msg);
		}

		// update battery stand of charge
		if (powerBonus) {
			await this.adapter.setStateAsync(XID_EEG_STATE_SOC_LAST_BONUS, batSoc);
		}

		// Update the state
		await this.adapter.setStateAsync(XID_EEG_STATE_BONUS, powerBonus);
	}
}
