import { RenewableEnergySmarthomeController } from '../main';
import { AverageValueHandler } from './average-value-handler';
import { XID_EEG_STATE_BONUS, XID_EEG_STATE_SOC_LAST_BONUS, XID_INGOING_BAT_SOC } from './dp-handler';

export class AnalyzerBonus {
	// TODO move to config
	private readonly sellingThreshold: number = 0.5;
	private readonly bonusReportThreshold: number = 0.3;

	constructor(private adapter: RenewableEnergySmarthomeController, private avgValueHandler: AverageValueHandler) {}

	public async run(): Promise<void> {
		// TODO investigate on how to configure values
		// if (!this.adapter.config.optionEnergyManagementActive) {
		// 	console.log('Energy Management is not active.');
		// 	return;
		// }

		let powerBonus = false;

		// Energy, missing (<0) oder additionally (>0) related to the household load
		const powerDif = await this.avgValueHandler.powerDif.getCurrent();
		const powerDifAvg = await this.avgValueHandler.powerDif.get10Min();

		// TODO PV Connection

		// there is a bonus, if the system is selling more then threshold
		if (powerDif > this.sellingThreshold) {
			powerBonus = true;
		}

		// there is no bonus, if not or to less selling to grid while the battery is low
		const gridPowerAvg = await this.avgValueHandler.powerGrid.get10Min();
		const batSoc = (await this.adapter.getStateAsync(XID_INGOING_BAT_SOC))!.val ?? 0;
		if (!(gridPowerAvg > this.sellingThreshold) && batSoc < 10) {
			powerBonus = false;
		}

		// report the bonus only if is solid
		const powerBonusEffective = powerBonus && powerDifAvg > this.bonusReportThreshold;

		const msg = `BonusAnalysis # Bonus PowerDif=${powerDif} PowerDifAvg=${powerDifAvg} => EffektiverBonus:${powerBonusEffective} SOC=${batSoc}`;
		const reportedBonus: boolean =
			((await this.adapter.getStateAsync(XID_EEG_STATE_BONUS))!.val as boolean) ?? false;

		if (powerBonusEffective && !reportedBonus) {
			console.log(msg + ' || STATE CHANGED');
		} else {
			console.debug(msg);
		}

		await this.UpdateBatSoc(powerBonusEffective);

		// Update the state
		await this.adapter.setStateAsync(XID_EEG_STATE_BONUS, powerBonusEffective);
	}

	private async UpdateBatSoc(powerBonus: boolean): Promise<void> {
		const currentBatSocLastBonus = (await this.adapter.getStateAsync(XID_EEG_STATE_SOC_LAST_BONUS))!.val ?? 0;
		const currentBatSoc = (await this.adapter.getStateAsync(XID_INGOING_BAT_SOC))!.val ?? 0;

		if (powerBonus || currentBatSoc > currentBatSocLastBonus) {
			await this.adapter.setStateAsync(XID_EEG_STATE_SOC_LAST_BONUS, currentBatSoc);
		}
	}
}
