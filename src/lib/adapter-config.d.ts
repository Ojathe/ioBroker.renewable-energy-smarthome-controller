// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			optionUseInfluxDb: boolean;
			optionInstanceInfluxDb: number;
			optionInstanceHistory: number;
			optionEnergyManagementActive: boolean;
			optionSourcePvGeneration: string;
			optionSourceTotalLoad: string;
			optionSourceBatterySoc: string;
			optionSourceSolarRadiation: string;
			optionSourceIsGridBuying: string;
			optionSourceIsGridLoad: string;
		}
	}
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
