/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { AverageValueHandler } from './lib/average-value-handler';
import {
	addSubscriptions,
	createObjects,
	XID_EEG_STATE_OPERATION,
	XID_INGOING_BAT_LOAD,
	XID_INGOING_BAT_SOC,
	XID_INGOING_GRID_LOAD,
	XID_INGOING_IS_GRID_BUYING,
	XID_INGOING_PV_GENERATION,
	XID_INGOING_SOLAR_RADIATION,
	XID_INGOING_TOTAL_LOAD,
} from './lib/dp-handler';

import { scheduleJob } from 'node-schedule';
import { AnalyzerBonus } from './lib/analyzer-bonus';
import { AnalyzerLack } from './lib/analyzer-lack';
import { setStateAsBoolean } from './lib/util/state-util';

// Load your modules here, e.g.:
// import * as fs from "fs";

export class RenewableEnergySmarthomeController extends utils.Adapter {
	private avgValueHandler: AverageValueHandler | undefined;
	private analyzerBonus: AnalyzerBonus | undefined;
	private analyzerLack: AnalyzerLack | undefined;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: 'renewable-energy-smarthome-controller',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));

		console.error('Ende Constructor');
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// TODO make sure that adapter will be restarted after config change
		this.log.debug('config ' + this.config);

		createObjects(this);

		addSubscriptions(this, this.config);

		setStateAsBoolean(this, XID_EEG_STATE_OPERATION, this.config.optionEnergyManagementActive);

		this.avgValueHandler = new AverageValueHandler(this);
		this.analyzerBonus = new AnalyzerBonus(this, this.avgValueHandler);
		this.analyzerLack = new AnalyzerLack(this, this.avgValueHandler);

		// calculating average Values
		// TODO make interval configurable
		scheduleJob('*/20 * * * * *', () => {
			console.log('calculating average Values');
			this.avgValueHandler!.calculate();
		});

		scheduleJob('*/30 * * * * *', () => {
			console.log('C H E C K I N G   F O R   B O N U S  /  L A C K');
			this.analyzerBonus!.run();
			this.analyzerLack!.run();
		});
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  */
	// private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			//this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

			this.updateIngoingDatapoints(id, state);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	private updateIngoingDatapoints(id: string, state: ioBroker.State) {
		let xidtoUpdate = '';
		switch (id) {
			case this.config.optionSourcePvGeneration:
				xidtoUpdate = XID_INGOING_PV_GENERATION;
				break;
			case this.config.optionSourceBatterySoc:
				xidtoUpdate = XID_INGOING_BAT_SOC;
				break;
			case this.config.optionSourceIsGridBuying:
				xidtoUpdate = XID_INGOING_IS_GRID_BUYING;
				break;
			case this.config.optionSourceIsGridLoad:
				xidtoUpdate = XID_INGOING_GRID_LOAD;
				break;
			case this.config.optionSourceSolarRadiation:
				xidtoUpdate = XID_INGOING_SOLAR_RADIATION;
				break;
			case this.config.optionSourceTotalLoad:
				xidtoUpdate = XID_INGOING_TOTAL_LOAD;
				break;
			case this.config.optionSourceBatteryLoad:
				xidtoUpdate = XID_INGOING_BAT_LOAD;
				break;
		}

		if (xidtoUpdate.length > 0) {
			this.setState(xidtoUpdate, { val: state.val, ack: true });
			console.log(`Updating ingoing-value '${xidtoUpdate}' from '${id}' with '${state.val}'`);
		}
	}
	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  */
	// private onMessage(obj: ioBroker.Message): void {
	// 	if (typeof obj === 'object' && obj.message) {
	// 		if (obj.command === 'send') {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info('send command');

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
	// 		}
	// 	}
	// }
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) =>
		new RenewableEnergySmarthomeController(options);
} else {
	// otherwise start the instance directly
	(() => new RenewableEnergySmarthomeController())();
}
