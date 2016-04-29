// HACK: We want the horizontal scroll to show on mouse enter and leave.
import Ember from 'ember';

export default Ember.Mixin.create({
  mouseEnter: function(event) {
    var $tablesContainer  = Ember.$(event.target).parents('.et-tables-container');
    var $horizontalScroll = $tablesContainer.find('.antiscroll-scrollbar-horizontal');
    $horizontalScroll.addClass('antiscroll-scrollbar-shown');
  },

  mouseLeave: function(event) {
    var $tablesContainer  = Ember.$(event.target).parents('.et-tables-container');
    var $horizontalScroll = $tablesContainer.find('.antiscroll-scrollbar-horizontal');
    $horizontalScroll.removeClass('antiscroll-scrollbar-shown');
  }
});
