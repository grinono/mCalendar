[
  'signIn', 'signUp', 'resetPwd',
  'forgotPwd', 'enrollAccount', 'changePwd'
].forEach(function(routeName) {
  AccountsTemplates.configureRoute(routeName, {
    layoutTemplate: 'userFormsLayout'
  });
});


Router.route('logout', {
  action: function() {
    Session.set('isLeftSidebarOpen', false);
    Meteor.logout();
    Router.go('/');
  }
});

Router.route('/profile/:_id', {
  template: 'profile',
  name: 'profile',
  waitOn: function() {
    return Meteor.subscribe('user', this.params._id);
  },

  action: function() {
    if (this.ready()) {
      if (Meteor.user()) {
        this.render('profile');
      } else {
        Router.go('atSignIn');
      }
    } else {
      this.render('loading');
    }
  }
});
