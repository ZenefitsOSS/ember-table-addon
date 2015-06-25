import Ember from 'ember';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';

export default Ember.ContainerView.extend(
StyleBindingsMixin, {
  classNames: 'lazy-list-container',
  styleBindings: ['height'],
  content: null,
  itemViewClass: null,
  rowHeight: null,
  scrollTop: null,
  startIndex: null,

  didInsertElement: function() {
    this._super();
    return this.onNumChildViewsDidChange();
  },

  height: Ember.computed(function() {
    return this.get('content.length') * this.get('rowHeight');
  }).property('content.length', 'rowHeight'),

  numChildViews: Ember.computed(function() {
    return this.get('numItemsShowing') + 2;
  }).property('numItemsShowing'),

  itemView: function() {
    // We are getting the class from a string e.g. "Ember.Table.Row"
    var itemViewClass = this.get('itemViewClass');
    if (typeof itemViewClass === 'string') {
      if (/[A-Z]+/.exec(itemViewClass)) {
        // Global var lookup - 'App.MessagePreviewView'
        return Ember.get(Ember.lookup, itemViewClass);
      } else {
        // Ember CLI Style lookup - 'message/preview'
        return this.container.lookupFactory("view:" + itemViewClass);
      }
    }
  }.property('itemViewClass'),

  onNumChildViewsDidChange: Ember.observer(function() {
    var itemView = this.get('itemView');
    var newNumViews = this.get('numChildViews');
    var oldNumViews = this.get('length');
    if (!itemView || !newNumViews) {
      return;
    }
    var numViewsToInsert = newNumViews - oldNumViews;
    // if newNumViews < oldNumViews we need to remove some views
    if (numViewsToInsert < 0) {
      var viewsToRemove = this.slice(newNumViews, oldNumViews);
      this.removeObjects(viewsToRemove);
      viewsToRemove.forEach(function(view) {
        view.destroy();
      });
    }
    // if oldNumViews < newNumViews we need to add more views
    else if (numViewsToInsert > 0) {
      var viewsToInsert = [];
      for (var i = 0; i < numViewsToInsert; ++i) {
        viewsToInsert.pushObject(this.createChildView(itemView));
      }
      // we want to batch insert view to make things faster
      this.pushObjects(viewsToInsert);
    }
    this.viewportDidChange();
  }, 'numChildViews', 'itemView'),

  // TODO(Peter): Consider making this a computed... binding logic will go
  // into the LazyItemMixin
  viewportDidChange: Ember.observer(function() {
    var childViews = this.get('childViews');
    var content = this.get('content') || [];
    var clength = content.get('length');
    var numShownViews = Math.min(this.get('length'), clength);
    var startIndex = this.get('startIndex');
    // this is a necessary check otherwise we are trying to access an object
    // that doesn't exist
    if (startIndex + numShownViews >= clength) {
      startIndex = clength - numShownViews;
    }
    if (startIndex < 0) {
      startIndex = 0;
    }
    // for all views that we are not using... just remove content
    // this makes them invisble
    childViews.forEach(function(childView, i) {
      if (i >= numShownViews) {
        childView.set('content', null);
        return;
      }
      var itemIndex = startIndex + i;
      childView = childViews.objectAt(itemIndex % numShownViews);
      var item = content.objectAt(itemIndex);
      if (item !== childView.get('content')) {
        childView.teardownContent();
        childView.setProperties({
          itemIndex: itemIndex,
          content: item
        });
        childView.prepareContent();
      }
    });
  }, 'content.length', 'length', 'startIndex')
});
