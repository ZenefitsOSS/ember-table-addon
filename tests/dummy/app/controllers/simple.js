import Ember from 'ember';
import ColumnDefinition from 'ember-table/models/column-definition';

export default Ember.Controller.extend({
	oneTableColumn: Ember.computed(function () {
		var dateColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Date',
			getCellContent: function (row) {
				return row.get('date').toDateString();
			}
		});
		return [dateColumn];
	}),

	twoTableColumns: Ember.computed(function () {
		var dateColumn = ColumnDefinition.create({
			savedWidth: 100,
			headerCellName: 'Date',
			canAutoResize: true,
			getCellContent: function (row) {
				return row.get('date').toDateString();
			}
		});
		var openColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Open',
			getCellContent: function (row) {
				return row.get('open').toFixed(2);
			},
			textAlign: 'u-textRight',
		});
		var highColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Fusce sit amet ex vehicula pretium lectus felis',
			getCellContent: function (row) {
				return row.get('open').toFixed(2);
			},
			textAlign: 'u-textRight',
		});
		return [dateColumn, openColumn, highColumn];
	}),

	threeTableColumns: Ember.computed(function () {
		var dateColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Date',
			getCellContent: function (row) {
				return row.get('date').toDateString();
			}
		});
		var openColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Open',
			getCellContent: function (row) {
				return row.get('open').toFixed(2);
			},
		});
		var highColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Fusce sit amet ex vehicula pretium lectus felis',
			getCellContent: function (row) {
				return row.get('open').toFixed(2);
			},
		});
		return [dateColumn, openColumn, highColumn];
	}),

	tableColumns: Ember.computed(function () {
		var dateColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Date',
			getCellContent: function (row) {
				return row.get('date').toDateString();
			}
		});
		var openColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Open',
			getCellContent: function (row) {
				return row.get('open').toFixed(2);
			}
		});
		var highColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'High',
			getCellContent: function (row) {
				return row.get('high').toFixed(2);
			}
		});
		var lowColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Low',
			getCellContent: function (row) {
				return row.get('low').toFixed(2);
			}
		});
		var closeColumn = ColumnDefinition.create({
			savedWidth: 200,
			headerCellName: 'Close',
			getCellContent: function (row) {
				return row.get('close').toFixed(2);
			},
			textAlign: 'u-textRight',
		});
		return [dateColumn, openColumn, highColumn, lowColumn, closeColumn];
	}),

	tableContent: Ember.computed(function () {
		return _.range(20).map(function (index) {
			var date = new Date();
			date.setDate(date.getDate() + index);
			return {
				date: date,
				open: Math.random() * 100 - 50,
				high: Math.random() * 100 - 50,
				low: Math.random() * 100 - 50,
				close: Math.random() * 100 - 50,
				volume: Math.random() * 1000000
			};
		});
	})
});
