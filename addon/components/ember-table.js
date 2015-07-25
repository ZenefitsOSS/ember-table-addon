import Ember from 'ember';
import StyleBindingsMixin from 'ember-table/mixins/style-bindings';
import ResizeHandlerMixin from 'ember-table/mixins/resize-handler';
import RowArrayController from 'ember-table/controllers/row-array';
import Row from 'ember-table/controllers/row';
import getScrollbarSize from 'ember-table/utils/get-scrollbar-size';

export default Ember.Component.extend(
StyleBindingsMixin, ResizeHandlerMixin, {
  classNames: ['et-tables-container'],
  classNameBindings: ['enableContentSelection:et-content-selectable',
    'hasFrozenColumnShadow:has-frozenColumnShdaow',
    'hasHeaderShdow:has-headerShadow',
    'hasFooterShdow:has-footerShadow'],
  hasFrozenColumnShadow: Ember.computed.gt('_tableScrollLeft', 0),
  hasHeaderShdow: Ember.computed.gt('_tableScrollTop', 0),
  hasFooterShdow: function() {
    // the scrollTop position when we are scrolled to bottom
    var scrollTopAtBottom = this.get('_tableContentHeight') - this.get('_bodyHeight');
    // has footer shadow when table is not scrolled to bottom
    return this.get('_tableScrollTop') !== scrollTopAtBottom;
  }.property('_tableScrollTop', '_bodyHeight', '_tableContentHeight'),

  // ---------------------------------------------------------------------------
  // API - Inputs
  // ---------------------------------------------------------------------------

  // Values which are bound to the table's style attr. See
  // `Ember.StyleBindingsMixin` documentation for more details.
  styleBindings: ['height'],

  // An array of row objects. Usually a hash where the keys are column names
  // and the values are the rows's values. However, could be any object, since
  // each column can define a function to return the column value given the row
  // object. See `Ember.Table.ColumnDefinition.getCellContent`.
  content: [],

  // An array of column definitions: see `Ember.Table.ColumnDefinition`. Allows
  // each column to have its own configuration.
  // TODO(new-api): Rename to `data`
  columns: null,

  // The number of fixed columns on the left side of the table. Fixed columns
  // are always visible, even when the table is scrolled horizontally.
  numFixedColumns: 0,

  // The number of footer rows in the table. Footer rows appear at the bottom of
  // the table and are always visible.
  // TODO(new-api): Rename to `numFooterRows`
  numFooterRow: 0,

  // The row height in pixels. A consistent row height is necessary to calculate
  // which rows are being shown, to enable lazy rendering.
  // TODO: Currently must be kept in sync with the SCSS file.
  rowHeight: 38,

  // The minimum header height in pixels. Headers will grow in height if given
  // more content than they can display.
  // TODO: Currently must be kept in sync with the SCSS file.
  minHeaderHeight: 38,

  // The footer height in pixels.
  // TODO: Currently must be kept in sync with the SCSS file.
  footerHeight: 38,

  // Enables or disables the header block.
  hasHeader: true,

  // Enables or disables the footer block.
  // TODO(new-api): Control this via `numFooterRows` and remove from API
  hasFooter: true,

  enableColumnReorder: true,

  // Allow users to select the content of table cells.
  enableContentSelection: false,

  // Sets which column resizing behavior to use. Possible values are
  // <code>'standard'</code> (resizing a column pushes or pulls all other
  // columns) and <code>'fluid'</code> (resizing a column steals width from
  // neighboring columns).
  columnMode: 'standard',

  // Sets which row selection behavior to follow. Possible values are 'none'
  // (clicking on a row does nothing), 'single' (clicking on a row selects it
  // and deselects other rows), and 'multiple' (multiple rows can be selected
  // through ctrl/cmd-click or shift-click).
  selectionMode: 'single',

  // similar to android: match-parent or wrap-content
  layoutHeight: 'match-parent',

  borderSize: 1,

  maxHeight: Infinity,

  // ---------------------------------------------------------------------------
  // API - Outputs
  // ---------------------------------------------------------------------------

  // An array of the rows currently selected. If `selectionMode` is set to
  // 'single', the array will contain either one or zero elements.
  selection: Ember.computed(function(key, val) {
    var selectionMode = this.get('selectionMode');
    if (arguments.length > 1 && val) {
      this.get('persistedSelection').clear();
      this.get('rangeSelection').clear();
      switch (selectionMode) {
        case 'single':
          this.get('persistedSelection').addObject(val);
          break;
        case 'multiple':
          this.get('persistedSelection').addObjects(val);
      }
    }
    var selection = this.get('persistedSelection').copy().addObjects(this.get('rangeSelection'));
    switch (selectionMode) {
      case 'none':
        return null;
      case 'single':
        return selection[0] || null;
      case 'multiple':
        return selection;
    }
  }).property('persistedSelection.[]', 'rangeSelection.[]', 'selectionMode'),

  // ---------------------------------------------------------------------------
  // Internal properties
  // ---------------------------------------------------------------------------

  // Special flag used by child views to look up this component using
  // nearestWithProperty()
  isEmberTable: true,

  columnsFillTable: true,

  height: Ember.computed.alias('_tablesContainerHeight'),

  // TODO(new-api): eliminate view alias
  // specify the view class to use for rendering the table rows
  tableRowView: 'table-row',
  tableRowViewClass: Ember.computed.alias('tableRowView'),

  // _resolvedContent is an intermediate property between content and rows
  // This allows content to be a plain array or a promise resolving to an array
  _resolvedContent: function(key, value) {
    if (arguments.length > 1) {
      return value;
    } else {
      var _this = this;
      value = [];

      var content = this.get('content');
      if (content.then)
      {
        // content is a promise
        content.then(function(resolvedContent) {
          // when the promise resolves, set this property so it gets cached
          _this.set('_resolvedContent', resolvedContent);

          // if the promise resolves immediately, set `value` so we return
          // the resolved value and not []
          value = resolvedContent;
        });

        // returns [] if the promise doesn't resolve immediately, or
        // the resolved value if it's ready
        return value;
      }
      else
      {
        // content is not a promise
        return content;
      }
    }
  }.property('content'),

  init: function() {
    this._super();
    if (!Ember.$.ui) {
      throw 'Missing dependency: jquery-ui';
    }
    if (!Ember.$().mousewheel) {
      throw 'Missing dependency: jquery-mousewheel';
    }
    return this.prepareTableColumns();
  },

  // TODO(azirbel): Document
  actions: {
    addColumn: Ember.K,
    sortByColumn: Ember.K
  },

  onColumnSort: function(column, newIndex) {
    // Fixed columns are not affected by column reordering
    var numFixedColumns = this.get('fixedColumns.length');
    var columns = this.get('columns');
    columns.removeObject(column);
    columns.insertAt(numFixedColumns + newIndex, column);
    return this.prepareTableColumns();
  },

  // An array of Ember.Table.Row computed based on `content`
  bodyContent: Ember.computed(function() {
    return RowArrayController.create({
      target: this,
      parentController: this,
      container: this.get('container'),
      itemController: Row,
      content: this.get('_resolvedContent')
    });
  }).property('_resolvedContent.[]'),

  // An array of Ember.Table.Row
  footerContent: Ember.computed(function(key, value) {
    if (value) {
      return value;
    } else {
      return Ember.A();
    }
  }).property(),

  fixedColumns: Ember.computed(function() {
    var columns = this.get('columns');
    if (!columns) {
      return Ember.A();
    }
    var numFixedColumns = this.get('numFixedColumns') || 0;
    return columns.slice(0, numFixedColumns) || [];
  }).property('columns.@each', 'numFixedColumns'),

  tableColumns: Ember.computed(function() {
    var columns = this.get('columns');
    if (!columns) {
      return Ember.A();
    }
    var numFixedColumns = this.get('numFixedColumns') || 0;
    return columns.slice(numFixedColumns, columns.get('length')) || [];
  }).property('columns.@each', 'numFixedColumns'),

  prepareTableColumns: function() {
    var _this = this;
    var columns = this.get('columns') || Ember.A();
    columns.setEach('controller', this);
    columns.forEach(function(col, i) {
      col.set('nextResizableColumn', _this.getNextResizableColumn(columns, i));
    });
  },

  getNextResizableColumn: function(columns, index) {
    var column;
    while (index < columns.length) {
      index += 1;
      column = columns.objectAt(index);
      if (column != null && column.get('isResizable')) {
        return column;
      }
    }
    return null;
  },

  // ---------------------------------------------------------------------------
  // View concerns
  // ---------------------------------------------------------------------------

  didInsertElement: function() {
    this._super();
    this.set('_scrollbarSize', getScrollbarSize());
    this.elementSizeDidChange();
  },

  onResizeEnd: function() {
    if (this.tableWidthNowTooSmall()) {
      this.set('columnsFillTable', true);
    }
    return Ember.run(this, this.elementSizeDidChange);
  },

  elementSizeDidChange: function() {
    if ((this.get('_state') || this.get('state')) !== 'inDOM') {
      return;
    }
    // border size of the table. we need to take this into account
    var totalBorderWidth = this.get('borderSize') * 2;
    this.beginPropertyChanges();
    // We use innerWidth and innerHeight in case the parent has a border
    this.setProperties({
      _width: this.$().parent().innerWidth() - totalBorderWidth,
      _height: this.$().parent().innerHeight() - totalBorderWidth
    });
    this.updateHeaderLayout();
    this.updateLayout();
    this.endPropertyChanges();
  },

  updateHeaderLayout: function() {
    // TODO(Louis): This seems bad...
    var heights = Ember.$('.et-header-block .et-content').map(function() {
      return Ember.$(this).outerHeight();
    });
    var maxHeight = Math.max.apply(null, heights);
    return this.set('_contentHeaderHeight', maxHeight);
  },

  updateLayout: function() {
    if ((this.get('_state') || this.get('state')) !== 'inDOM') {
      return;
    }
    if (this.get('columnsFillTable')) {
      return this.doForceFillColumns();
    }
  },

  tableWidthNowTooSmall: function() {
    if ((this.get('_state') || this.get('state')) !== 'inDOM') {
      return false;
    }
    var oldTableWidth = this.get('_width');
    var newTableWidth = this.$().parent().width();
    // TODO(azirbel): This should be 'columns', I believe. Fix separately.
    var totalColumnWidth = this._getTotalWidth(this.get('tableColumns'));
    return (oldTableWidth > totalColumnWidth) && (newTableWidth < totalColumnWidth);
  },

  // Iteratively adjusts column widths to adjust to a changed table width.
  // Attempts to scale columns proportionally. However, if a column hits a min
  // or max width after scaling proportionally, we need to respect that setting.
  // In that case, keep iterating until all column widths are set to the best
  // they can be. Note that this may fail to arrive at the table width if the
  // resizable columns are all restricted by min/max widths.
  doForceFillColumns: function() {
    var allColumns = this.get('columns');
    var columnsToResize = allColumns.filterProperty('canAutoResize');
    var unresizableColumns = allColumns.filterProperty('canAutoResize', false);
    // TODO(Louis): Remove 3px from the available width to make the last column
    // more easily sortable. Value needs to be synced with _tableColumnsWidth
    var availableWidth = this.get('_width') - this._getTotalWidth(unresizableColumns);
    if (this.get('_hasVerticalScrollbar')) {
      availableWidth -= this.get('_scrollbarSize');
    }

    var doNextLoop = true;
    var nextColumnsToResize = [];
    var totalResizableWidth;
    var newWidth;

    while (doNextLoop) {
      doNextLoop = false;
      nextColumnsToResize = [];
      totalResizableWidth = this._getTotalWidth(columnsToResize);
      if (this.get('_hasVerticalScrollbar')) {
        totalResizableWidth += this.get('_scrollbarSize');
      }
      /*jshint loopfunc:true */
      // TODO(azirbel): Revisit JSHint error above
      columnsToResize.forEach(function(column) {
        newWidth = Math.floor((column.get('width') / totalResizableWidth) * availableWidth);
        if (newWidth < column.get('minWidth')) {
          doNextLoop = true;
          column.set('width', column.get('minWidth'));
          availableWidth -= column.get('width');
        } else if (newWidth > column.get('maxWidth')) {
          doNextLoop = true;
          column.set('width', column.get('maxWidth'));
          availableWidth -= column.get('width');
        } else {
          column.set('width', newWidth);
          nextColumnsToResize.pushObject(column);
        }
        columnsToResize = nextColumnsToResize;
      });
    }
  },

  onBodyContentLengthDidChange: Ember.observer(function() {
    return Ember.run.next(this, function() {
      return Ember.run.once(this, this.updateLayout);
    });
  }, 'bodyContent.length'),

  // ---------------------------------------------------------------------------
  // Private variables
  // ---------------------------------------------------------------------------

  _tableScrollTop: 0,
  _tableScrollLeft: 0,
  _scrollbarSize: 0,

  _width: null,
  _height: null,
  _contentHeaderHeight: null,

  // ---------------------------------------------------------------------------
  // Scrollbars
  // ---------------------------------------------------------------------------

  _horizontalScrollbarSize: 0,
  _verticalScrollbarSize: 0,

  measureBlockDimensions: function() {
    var hasHeader = this.get('hasHeader');
    var hasFooter = this.get('hasFooter');
    var rowHeight = this.get('rowHeight');
    var maxHeight = this.get('maxHeight');
    var footerHeight = this.get('footerHeight');
    var numRows = this.get('bodyContent.length');
    var _height = this.get('_height');
    var _width = this.get('_width');
    var layoutHeight = this.get('layoutHeight');
    var useContentHeight = layoutHeight === 'wrap-content';

    // NOTE: measuring horizontal and vertical scrollbar size here will cause loop
    // we have to breakup calculations.
    var _horizontalScrollbarSize = this.get('_horizontalScrollbarSize');
    var _verticalScrollbarSize = this.get('_verticalScrollbarSize');

    var _tableContainerWidth = _width;

    // calculate header heights
    var minHeaderHeight = this.get('minHeaderHeight');
    var headerContentHeight = this.get('_contentHeaderHeight');
    // Dynamic header height that adjusts according to the header content height
    var _headerHeight = hasHeader ? Math.max(headerContentHeight, minHeaderHeight) : 0;

    // calculate footer heights
    var _footerHeight = hasFooter ? footerHeight : 0;

    // actual width of left block
    var _fixedColumnsWidth = this._getTotalWidth(this.get('fixedColumns'));
    var _fixedBlockWidth = _fixedColumnsWidth;

    // center block container width
    var _centerBlockContainerWidth = _tableContainerWidth - _fixedColumnsWidth;
    var _tableBlockWidth = _centerBlockContainerWidth;

    var bodyContentWidth = this._getTotalWidth(this.get('tableColumns'));
    // center block content width
    var _tableColumnsWidth = Math.max(bodyContentWidth + 3, _centerBlockContainerWidth) - _verticalScrollbarSize;
    var _rowWidth = Math.max(bodyContentWidth, _centerBlockContainerWidth);

    var _tableContentHeight = rowHeight * numRows;
    // tables-container height adjusts to the content height
    var _tablesContainerHeight = _height;
    if (useContentHeight) {
      _tablesContainerHeight = Math.min(maxHeight, _tableContentHeight + _headerHeight + _footerHeight + _horizontalScrollbarSize);
    }
    var _bodyHeight = _tablesContainerHeight - _headerHeight - _footerHeight - _horizontalScrollbarSize;

    var _numItemsShowing = Math.floor(_bodyHeight / rowHeight);

    this.setProperties({
      _tableContainerWidth: _tableContainerWidth,
      _tablesContainerHeight: _tablesContainerHeight,
      _fixedColumnsWidth: _fixedColumnsWidth,
      _fixedBlockWidth: _fixedBlockWidth,
      _centerBlockContainerWidth: _centerBlockContainerWidth,
      _tableBlockWidth: _tableBlockWidth,
      _tableColumnsWidth: _tableColumnsWidth,
      _rowWidth: _rowWidth,
      _tableContentHeight: _tableContentHeight,
      _headerHeight: _headerHeight,
      _bodyHeight: _bodyHeight,
      _footerHeight: _footerHeight,
      _numItemsShowing: _numItemsShowing
    });
  },

  measureScrollbars: function() {
    var _height = this.get('_height');
    var _width = this.get('_width');
    var _bodyHeight = this.get('_bodyHeight');
    var _tableContentHeight = this.get('_tableContentHeight');
    var _tableColumnsWidth = this.get('_tableColumnsWidth');
    var _tablesContainerHeight = this.get('_tablesContainerHeight');
    var _fixedColumnsWidth = this.get('_fixedColumnsWidth');
    var _centerBlockContainerWidth = this.get('_centerBlockContainerWidth');
    var _headerHeight = this.get('_headerHeight');
    var _footerHeight = this.get('_footerHeight');
    var _scrollbarSize = this.get('_scrollbarSize');

    var _hasVerticalScrollbar = _height < (_tableContentHeight + _headerHeight + _footerHeight);
    var _hasHorizontalScrollbar = _tableColumnsWidth > (_width - _fixedColumnsWidth);
    var _verticalScrollbarSize = _hasVerticalScrollbar ? _scrollbarSize : 0;
    var _horizontalScrollbarSize = _hasHorizontalScrollbar ? _scrollbarSize : 0;

    // Update containers
    _tableColumnsWidth = _tableColumnsWidth - _verticalScrollbarSize;
    _tablesContainerHeight = _tablesContainerHeight + _horizontalScrollbarSize;
    _bodyHeight = _bodyHeight - _verticalScrollbarSize;

    // Set heights on the scroll container
    var _scrollContainerHeight = _horizontalScrollbarSize;
    var _scrollContainerWidth = _centerBlockContainerWidth - _verticalScrollbarSize;

    this.setProperties({
      _hasVerticalScrollbar: _hasVerticalScrollbar,
      _hasHorizontalScrollbar: _hasHorizontalScrollbar,
      _verticalScrollbarSize: _verticalScrollbarSize,
      _horizontalScrollbarSize: _horizontalScrollbarSize,
      _bodyHeight: _bodyHeight,
      _tableColumnsWidth: _tableColumnsWidth,
      _tablesContainerHeight: _tablesContainerHeight,
      _scrollContainerHeight: _scrollContainerHeight,
      _scrollContainerWidth: _scrollContainerWidth
    });
  },

  measureDimentsions: function() {
    this.measureBlockDimensions();
    this.measureScrollbars();
  },

  propertiesDidChange: function() {
    // react style render...
    // prevent measureDimentsions from being called more than once per runloop
    Ember.run.scheduleOnce('afterRender', this, this.measureDimentsions);
  }.observes('_height', '_width', 'hasHeader', 'hasFooter', 'footerHeight',
      'rowHeight', 'maxHeight', 'bodyContent.length',
      '_contentHeaderHeight', 'minHeaderHeight', 'columns.@each.width'),

  // ---------------------------------------------------------------------------
  // Other
  // ---------------------------------------------------------------------------

  _startIndex: Ember.computed(function() {
    var numContent = this.get('bodyContent.length');
    var numViews = this.get('_numItemsShowing');
    var rowHeight = this.get('rowHeight');
    var scrollTop = this.get('_tableScrollTop');
    var index = Math.floor(scrollTop / rowHeight);
    // Adjust start index so that end index doesn't exceed content length
    if (index + numViews >= numContent) {
      index = numContent - numViews;
    }
    return Math.max(index, 0);
  }).property('bodyContent.length', '_numItemsShowing', 'rowHeight',
      '_tableScrollTop'),

  _getTotalWidth: function(columns, columnWidthPath) {
    if (columnWidthPath == null) {
      columnWidthPath = 'width';
    }
    if (!columns) {
      return 0;
    }
    var widths = columns.getEach(columnWidthPath) || [];
    return widths.reduce((function(total, w) {
      return total + w;
    }), 0);
  },

  // ---------------------------------------------------------------------------
  // Selection
  // TODO: Make private or reorganize into a new section
  // ---------------------------------------------------------------------------

  lastSelected: null,

  isSelected: function(row) {
    switch (this.get('selectionMode')) {
      case 'none':
        return false;
      case 'single':
        return this.get('selection') === row.get('content');
      case 'multiple':
        return this.get('selection').contains(row.get('content'));
    }
  },

  setSelected: function(row, val) {
    this.persistSelection();
    var item = row.get('content');
    if (val) {
      return this.get('persistedSelection').addObject(item);
    } else {
      return this.get('persistedSelection').removeObject(item);
    }
  },

  // items that were selected directly or as part of a previous
  // range selection (shift-click)
  persistedSelection: Ember.computed(function() {
    return Ember.A();
  }),

  // items that are part of the currently editable range selection
  rangeSelection: Ember.computed(function() {
    return Ember.A();
  }),

  // TODO: Handle click event in the row view
  click: function(event) {
    var row = this.getRowForEvent(event);
    if (!row || !row.get('content')) {
      return;
    }
    var item = row.get('content');
    switch (this.get('selectionMode')) {
      case 'none':
        break;
      case 'single':
        this.get('persistedSelection').clear();
        this.get('persistedSelection').addObject(item);
        break;
      case 'multiple':
        if (event.shiftKey) {
          this.get('rangeSelection').clear();

          var lastIndex = this.rowIndex(this.get('lastSelected'));
          // If the last selected row is no longer in the table, use the
          // first row in the table
          if (lastIndex === -1) {
            lastIndex = 0;
          }

          var curIndex = this.rowIndex(this.getRowForEvent(event));
          var minIndex = Math.min(lastIndex, curIndex);
          var maxIndex = Math.max(lastIndex, curIndex);

          this.get('rangeSelection').addObjects(
            this.get('bodyContent').slice(minIndex, maxIndex + 1)
            .mapBy('content'));
        } else {
          if (!event.ctrlKey && !event.metaKey) {
            this.get('persistedSelection').clear();
            this.get('rangeSelection').clear();
          } else {
            this.persistSelection();
          }
          if (this.get('persistedSelection').contains(item)) {
            this.get('persistedSelection').removeObject(item);
          } else {
            this.get('persistedSelection').addObject(item);
          }
          this.set('lastSelected', row);
        }
        break;
    }
  },

  findRow: function(content) {
    // TODO(azirbel): Replace with filter
    this.get('bodyContent').forEach(function(row) {
      if (row.get('content') === content) {
        return row;
      }
    });
    return null;
  },

  rowIndex: function(row) {
    if (!this.get('bodyContent')) {
      return null;
    }
    return this.get('bodyContent').indexOf(row);
  },

  persistSelection: function() {
    this.get('persistedSelection').addObjects(this.get('rangeSelection'));
    this.get('rangeSelection').clear();
  },

  getRowForEvent: function(event) {
    var $rowView = Ember.$(event.target).parents('.et-table-row');
    var view = Ember.View.views[$rowView.attr('id')];
    if (view) {
      return view.get('row');
    }
    return null;
  }
});
