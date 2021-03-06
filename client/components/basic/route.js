Router.configure({
  layoutTemplate: 'layoutEntry',
  notFoundTemplate: '404',
  loadingTemplate: 'loading'
});

Router.map(function() {
  this.route('home', {
    path: '/',
    action: function() {
      Session.set('layout', 'defaultLayout');
      this.render('home');
    }
  });

  this.route('about', {
    path: '/about',
    action: function() {
      this.render('about');
    }
  });
});


Router.onBeforeAction(function () {
  // reset left/right sidebars flag.
  // each service decides how to show left/right sidebars
  Session.set('isLeftSidebarOpen', false);
  Session.set('isRightSidebarOpen', false);
  Session.set('layout', 'defaultAdminLayout');
  this.next();
});

// page title
Router.onAfterAction(function () {
  document.title = [App.name, ' - ', this.route.getName()].join('');
  if (App.env === 'development') {
    Session.set('currentView', this.route.getName());
  }
});

