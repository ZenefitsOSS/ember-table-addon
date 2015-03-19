import Ember from 'ember';
import TableContainer from 'ember-table/views/table-container';
import RegisterTableComponentMixin from 'ember-table/mixins/register-table-component';

export default TableContainer.extend(RegisterTableComponentMixin, {
  templateName: 'header-table-container',
  classNames: ['ember-table-table-container',
      'ember-table-fixed-table-container',
      'ember-table-header-container'],
  height: Ember.computed.alias('tableComponent._headerHeight'),
  width: Ember.computed.alias('tableComponent._tableContainerWidth')
});
