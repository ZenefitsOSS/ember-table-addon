import Ember from 'ember';
import TableContainer from 'ember-table/views/table-container';
import RegisterTableComponentMixin from 'ember-table/mixins/register-table-component';
import MouseWheelHandlerMixin from 'ember-table/mixins/mouse-wheel-handler';
import TouchMoveHandlerMixin from 'ember-table/mixins/touch-move-handler';

export default TableContainer.extend(
MouseWheelHandlerMixin, TouchMoveHandlerMixin, RegisterTableComponentMixin, {
  templateName: 'footer-table-container',
  classNames: ['et-table-container',
    'et-fixed-table-container',
    'et-footer-container'],
  styleBindings: 'top',
  height: Ember.computed(function() {
    var height = this.get('tableComponent._footerHeight');
    if(this.get('tableComponent._hasHorizontalScrollbar')){
      height += this.get('tableComponent._scrollbarSize');
    }
    return height;
  }).property('tableComponent._footerHeight',
    'tableComponent._hasHorizontalScrollbar', 'tableComponent._scrollbarSize'),
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
    var scrollLeft = this.$('.et-right-table-block').scrollLeft() +
        deltaX;
    this.set('scrollLeft', scrollLeft);
    event.preventDefault();
  },

  onTouchMove: function(event, deltaX) {
    var scrollLeft = this.$('.et-right-table-block').scrollLeft() +
        deltaX;
    this.set('scrollLeft', scrollLeft);
    event.preventDefault();
  }
});
