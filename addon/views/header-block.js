import Ember from 'ember';
import TableBlock from '../views/table-block';

export default TableBlock.extend({
  classNames: ['et-header-block'],
  // TODO(new-api): Eliminate view alias
  itemView: 'header-row',
  itemViewClass: Ember.computed.alias('itemView'),

  content: Ember.computed(function() {
    return [this.get('columns')];
  }).property('columns')
});
