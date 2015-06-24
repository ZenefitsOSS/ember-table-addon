import Ember from 'ember';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';
import RegisterTableComponentMixin from 'ember-table/mixins/register-table-component';

// TODO: This should be a mixin
export default Ember.CollectionView.extend(
StyleBindingsMixin, RegisterTableComponentMixin, {
  classNames: ['et-table-block'],
  styleBindings: ['width', 'height'],
  itemViewClass: Ember.computed.alias('tableComponent.tableRowViewClass'),
  height: Ember.computed.oneWay('tableComponent._headerHeight'),
  columns: null,
  content: null,
  scrollLeft: null,

  onScrollLeftDidChange: Ember.observer(function() {
    return this.$().scrollLeft(this.get('scrollLeft'));
  }, 'scrollLeft')

});
