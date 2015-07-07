﻿define(function(require) {
  'use strict';

  // /collection/
  // /collection/activePane/
  require('test/foreground/collection/activePane/activePanes.spec');

  // /model/
  // /model/appBar/
  require('test/foreground/model/appBar/activePaneFilter.spec');

  // /model/streamControlBar/
  require('test/foreground/model/streamControlBar/timeLabelArea.spec');
  require('test/foreground/model/streamControlBar/timeSlider.spec');

  // /view/
  // /view/activePane/
  require('test/foreground/view/activePane/activePaneSpecLoader');

  // /view/appBar/
  require('test/foreground/view/appBar/appBarSpecLoader');

  // /view/behavior/
  require('test/foreground/view/behavior/behaviorSpecLoader');

  // /view/dialog/
  require('test/foreground/view/dialog/dialogSpecLoader');

  // /view/element/
  require('test/foreground/view/element/elementSpecLoader');

  // /view/leftPane/
  require('test/foreground/view/leftPane/leftPaneSpecLoader');

  // /view/listItemButton/
  require('test/foreground/view/listItemButton/listItemButtonSpecLoader');

  // /view/notification/
  require('test/foreground/view/notification/notificationSpecLoader');

  // /view/playlist/
  require('test/foreground/view/playlist/playlistSpecLoader');

  // /view/search/
  require('test/foreground/view/search/searchSpecLoader');

  // /view/selectionBar/
  require('test/foreground/view/selectionBar/selectionBarSpecLoader');

  // /view/simpleMenu/
  require('test/foreground/view/simpleMenu/simpleMenuSpecLoader');

  // /view/stream/
  require('test/foreground/view/stream/streamSpecLoader');

  // /view/tooltip/
  require('test/foreground/view/tooltip/tooltipSpecLoader');

  // /view/video/
  require('test/foreground/view/video/videoSpecLoader');

  require('test/foreground/view/foregroundAreaView.spec');
  require('test/foreground/view/listItemView.spec');
});