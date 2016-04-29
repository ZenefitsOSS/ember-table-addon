import Ember from 'ember';
import TableContainer from 'ember-table/views/table-container';
import ShowHorizontalScrollMixin from 'ember-table/mixins/show-horizontal-scroll';
import RegisterTableComponentMixin from 'ember-table/mixins/register-table-component';

export default TableContainer.extend(ShowHorizontalScrollMixin, RegisterTableComponentMixin, {
  templateName: 'header-table-container',
  classNames: [
  	'et-table-container',
    'et-fixed-table-container',
    'et-header-container'
  ],
  height: Ember.computed.alias('tableComponent._headerHeight'),
  width: Ember.computed.alias('tableComponent._tableContainerWidth')
});
