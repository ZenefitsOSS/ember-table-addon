import Ember from 'ember';

export default Ember.Mixin.create({
  resizeEndDelay: 200,
  resizing: false,
  onResizeStart: Ember.K,
  onResizeEnd: Ember.K,
  onResize: Ember.K,

  endResize: function(event) {
    if (this.isDestroyed) { return; }
    this.set('resizing', false);
    this.onResizeEnd(event);
  },

  handleWindowResize: function(event) {
    if (this.isDestroyed) { return; }
    if (!this.get('resizing')) {
      this.set('resizing', true);
      this.onResizeStart(event);
    }
    this.onResize(event);
    var resizeEndDelay = this.get('resizeEndDelay');
    return Ember.run.debounce(this, this.endResize, event, resizeEndDelay, false);
  },

  didInsertElement: function() {
    this._super();
    return this._setupDocumentHandlers();
  },

  willDestroyElement: function() {
    this._removeDocumentHandlers();
    return this._super();
  },

  _setupDocumentHandlers: function() {
    if (this._resizeHandler) {
      return;
    }
    this._resizeHandler = this.handleWindowResize.bind(this);
    return Ember.$(window).on("resize." + this.elementId, this._resizeHandler);
  },

  _removeDocumentHandlers: function() {
    Ember.$(window).off("resize." + this.elementId, this._resizeHandler);
    return this._resizeHandler = null;
  }
});
