import { RenewableEnergySmarthomeController } from '../main';
import { AverageValueHandler } from './average-value-handler';
import { XID_EEG_STATE_LOSS, XID_INGOING_BATTERY_SOC } from './dp-handler';

export class AnalyzerLack {
	constructor(private adapter: RenewableEnergySmarthomeController, private avgValueHandler: AverageValueHandler) {}

	// TODO move to config
	readonly threshold = -0.5;

	public async run(): Promise<void> {
		// TODO investigate on how to configure values
		// if (!this.adapter.config.optionEnergyManagementActive) {
		// 	console.log('Energy Management is not active.');
		// 	return;
		// }

		let powerLack = false;

		// Energy, missing (<0) oder additionally (>0) related to the household load
		const powerDif = await this.avgValueHandler.powerDif.getCurrent();
		const powerDifAvg = await this.avgValueHandler.powerDif.get10Min();
		const powerDifAvg5 = await this.avgValueHandler.powerDif.get5Min();
		const batSoc = (await this.adapter.getStateAsync(XID_INGOING_BATTERY_SOC))!.val ?? 0;

		// TODO PV Connection
		// Mangel, wenn
		//	-> mindestens 2kW vom Stromnetz/AKku bezogen werden,
		//	-> der Akku weniger als 95% hat
		//	-> kaum bis keine Solarstrahlung existiert
		if (powerDif < -1.9 && batSoc < 95) {
			powerLack = true;
		}

		// Mangel, wenn
		//	-> mindestens 1kW vom Stromnetz / Akku bezogen werden
		//	-> der Akkustand unterhalb von 60% ist
		if (powerDif < -0.9 && batSoc < 60) {
			powerLack = true;
		}

		// Mangel, wenn
		//    -> mindestens 0,5kW vom Stromnetz / Akku bezogen werden
		//    -> der Akku unterhalb 30% ist
		if (powerDif < -0.5 && batSoc < 30) {
			powerLack = true;
		}

		// Mangel, wenn
		//    -> überhaupt vom Stromnetz / Akku bezogen werden
		//    -> der Akku unterhalb 10% ist
		if (powerDif < 0 && batSoc < 10) {
			powerLack = true;
		}

		// TODO BatteryPower

		// report the lack only if is solid (5 or 10 Minutes depending on current state)
		const powerLackEffective = powerLack ? powerDifAvg5 < this.threshold : powerDifAvg < this.threshold;

		const msg = `LackAnalysis # Lack PowerDif=${powerDif} PowerDifAvg=${powerDifAvg} => EffectiveLack:${powerLackEffective} SOC=${batSoc}`;
		const reportedLack: boolean = ((await this.adapter.getStateAsync(XID_EEG_STATE_LOSS))!.val as boolean) ?? false;

		if (powerLackEffective && !reportedLack) {
			console.log(msg + ' || STATE CHANGED');
		} else {
			console.debug(msg);
		}

		// Update the state
		await this.adapter.setStateAsync(XID_EEG_STATE_LOSS, powerLackEffective);
	}
}
