import { utils } from '@iobroker/testing';
import { expect } from 'chai';

const { adapter, database } = utils.unit.createMocks({});

describe('analyzer-lack', () => {
	afterEach(() => {
		// The mocks keep track of all method invocations - reset them after each single test
		adapter.resetMockHistory();
		// We want to start each test with a fresh database
		database.clear();
	});
	describe('func', () => {
		xit('test', () => {
			expect(false).to.be.true;
		});
	});
});
