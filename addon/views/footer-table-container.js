import Ember from 'ember';
import TableContainer from 'ember-table/views/table-container';
import ShowHorizontalScrollMixin from 'ember-table/mixins/show-horizontal-scroll';
import RegisterTableComponentMixin from 'ember-table/mixins/register-table-component';

export default TableContainer.extend(
Ember.MouseWheelHandlerMixin, Ember.TouchMoveHandlerMixin,
ShowHorizontalScrollMixin, RegisterTableComponentMixin, {
  templateName: 'footer-container',
  classNames: ['ember-table-table-container',
    'ember-table-fixed-table-container',
    'ember-table-footer-container'],
  styleBindings: 'top',
  height: Ember.computed.alias('tableComponent.footerHeight'),
  width: Ember.computed.alias('tableComponent._tableContainerWidth'),
  scrollLeft: Ember.computed.alias('tableComponent._tableScrollLeft'),

  top: Ember.computed(function() {
    var headerHeight = this.get('tableComponent._headerHeight');
    var contentHeight = this.get('tableComponent._tableContentHeight') +
        headerHeight;
    var bodyHeight = this.get('tableComponent._bodyHeight') + headerHeight;
    if (contentHeight < bodyHeight) {
      return contentHeight;
    } else {
      return bodyHeight;
    }
  }).property('tableComponent._bodyHeight', 'tableComponent._headerHeight',
      'tableComponent._tableContentHeight'),

  onMouseWheel: function(event, delta, deltaX) {
    var scrollLeft = this.$('.ember-table-right-table-block').scrollLeft() +
        deltaX;
    this.set('scrollLeft', scrollLeft);
    event.preventDefault();
  },

  onTouchMove: function(event, deltaX) {
    var scrollLeft = this.$('.ember-table-right-table-block').scrollLeft() +
        deltaX;
    this.set('scrollLeft', scrollLeft);
    event.preventDefault();
  }
});