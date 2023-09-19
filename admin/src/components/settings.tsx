import React from 'react';
import I18n from '@iobroker/adapter-react/i18n';
import {
	Checkbox,
	FormControl,
	FormControlLabel,
	FormHelperText,
	Grid,
	Input,
	MenuItem,
	Select,
	Switch,
	TextField,
} from '@mui/material';
import styled from '@emotion/styled';

interface SettingsProps {
	native: Record<string, any>;
	onChange: (attr: string, value: any) => void;
}

interface SettingsState {
	// add your state properties here
	dummy?: undefined;
}

class Settings extends React.Component<SettingsProps, SettingsState> {
	constructor(props: SettingsProps) {
		console.log('props in Settings: ', props);
		super(props);
		this.state = {};
	}

	renderInput(title: AdminWord, attr: string, type: string, required?: boolean) {
		const MyTextField = styled(TextField)`
			width: 100%;
		`;

		return (
			<Grid xs={6}>
				<MyTextField
					required={required}
					variant={'outlined'}
					label={I18n.t(title)}
					className={`input controlElement`}
					value={this.props.native[attr]}
					type={type || 'text'}
					onChange={(e) => this.props.onChange(attr, e.target.value)}
					margin="normal"
				/>
			</Grid>
		);
	}

	renderSelect(
		title: AdminWord,
		attr: string,
		options: { value: string; title: AdminWord }[],
		style?: React.CSSProperties,
	) {
		return (
			<Grid xs={6}>
				<FormControl
					className={`input controlElement`}
					style={{
						paddingTop: 5,
						...style,
					}}
				>
					<Select
						value={this.props.native[attr] || '_'}
						onChange={(e) => this.props.onChange(attr, e.target.value === '_' ? '' : e.target.value)}
						input={<Input name={attr} id={attr + '-helper'} />}
					>
						{options.map((item) => (
							<MenuItem key={'key-' + item.value} value={item.value || '_'}>
								{I18n.t(item.title)}
							</MenuItem>
						))}
					</Select>
					<FormHelperText>{I18n.t(title)}</FormHelperText>
				</FormControl>
			</Grid>
		);
	}

	renderSwitch(title: AdminWord, attr: string, style?: React.CSSProperties) {
		return (
			<Grid xs={6}>
				<FormControlLabel
					style={{
						paddingTop: 5,
						...style,
					}}
					required
					control={
						<Switch
							checked={this.props.native[attr]}
							onChange={() => this.props.onChange(attr, !this.props.native[attr])}
						/>
					}
					label={I18n.t(title)}
				/>
			</Grid>
		);
	}

	renderCheckbox(title: AdminWord, attr: string, style?: React.CSSProperties) {
		return (
			<FormControlLabel
				key={attr}
				style={{
					paddingTop: 5,
					...style,
				}}
				className="controlElement"
				control={
					<Checkbox
						checked={this.props.native[attr]}
						onChange={() => this.props.onChange(attr, !this.props.native[attr])}
						color="primary"
					/>
				}
				label={I18n.t(title)}
			/>
		);
	}

	render() {
		const MyGrid = styled(Grid)`
			padding: 24px;
		`;

		return (
			<MyGrid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
				{this.renderSwitch('optionUseInfluxDb', 'optionUseInfluxDb')}
				{this.renderInput('optionInstanceInfluxDb', 'optionInstanceInfluxDb', 'number')}
				{this.renderInput('optionInstanceHistory', 'optionInstanceHistory', 'number')}
				{this.renderInput('optionSourcePvGeneration', 'optionSourcePvGeneration', 'text', true)}
				{this.renderInput('optionSourceTotalLoad', 'optionSourceTotalLoad', 'text', true)}
				{this.renderInput('optionSourceBatterySoc', 'optionSourceBatterySoc', 'text', true)}
				{this.renderInput('optionSourceSolarRadiation', 'optionSourceSolarRadiation', 'text', true)}
				{this.renderInput('optionSourceIsGridBuying', 'optionSourceIsGridBuying', 'text', true)}
				{this.renderInput('optionSourceGridLoad', 'optionSourceGridLoad', 'text', true)}
				{this.renderInput('optionSourceBatteryLoad', 'optionSourceBatteryLoad', 'text', true)}
				{this.renderSwitch('optionEnergyManagementActive', 'optionEnergyManagementActive')}
			</MyGrid>
		);
	}
}

export default styled(Settings)`
	&& {
		background-color: pink;
	}
`;

// export default styled(Settings)`
// 	.input {
// 		margin-top: 0;
// 		min-width: 400px;
// 		margin-bottom: 16px;
// 	}
//
// 	.button {
// 		margin-right: 20px;
// 	}
//
// 	.card {
// 		max-width: 345px;
// 		text-align: center;
// 	}
//
// 	.media {
// 		height: 180px;
// 	}
//
// 	.column {
// 		display: inline-block;
// 		vertical-align: top;
// 		margin-right: 20px;
// 	}
//
// 	.columnLogo {
// 		width: 350px;
// 		margin-right: 0;
// 	}
//
// 	.columnSettings {
// 		width: calc(100% - 370px);
// 	}
//
// 	.controlElement {
// 		//background: "#d2d2d2",
// 		margin-bottom: 5px;
// 	}
// `;
