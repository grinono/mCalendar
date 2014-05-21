var ifViewing, login;

ifViewing = function(viewName) {
  return Session.get('currentView') === viewName;
};

Template.navBar.userEmail = function() {
  return Meteor.user().emails[0].address;
};

Template.navBar.isNotCalendarView = function() {
  return (Meteor.userId() && Session.get('currentView') !== 'calendar');
};

Template.navBar.events({
  'click a#logout': function() {
     Meteor.logout(function() {
       Router.go('/');
    });
  }
});

Template.calendar.rendered = function() {
  if (Meteor.userId()) {
    App.generateCalendar();
    $('#myModal').on('show', function() {
      $('#myModal').removeClass('hidden');
    });
    $('#myModal').on('hdie', function() {
      $('#myModal').addClass('hidden');
    });
  }
};

Template.newEvent.rendered = function() {
  App.geocoder = L.mapbox.geocoder(App.mapboxApiKey);
  var acceptGeo = function(p){
    App.map = L.mapbox.map('map');
    L.mapbox.tileLayer(App.mapboxApiKey)
    .on('ready', function () {
      $('#floatingBarsG').remove();
    }).addTo(App.map);
    App.map.setView([p.coords.latitude, p.coords.longitude],13);
  };
  var defaultMapView = function() {
    App.map = L.mapbox.map('map');
    L.mapbox.tileLayer(App.mapboxApiKey)
    .on('ready', function () {
      $('#floatingBarsG').remove();
    }).addTo(App.map);
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(acceptGeo, defaultMapView);
  } else {
    defaultMapView();
  }
};

Template.newEvent.loadingMap = function() {
  return Session.set('loadingMap', true);
};

Template.newEvent.events({
  'click #share': function(e, t) {
    if(e.target.checked) {
      $('#sharedEmail').prop('disabled', false);
    } else {
      $('#sharedEmail').prop('disabled', true);
    }
  },
  'click #allDay': function(e, t) {
    if(e.target.checked) {
      $('#eventStart').prop('disabled', true);
      $('#eventEnd').prop('disabled', true);
    } else {
      $('#eventStart').prop('disabled', false);
      $('#eventEnd').prop('disabled', false);
    }
  },
  'keypress input#address': function(e, t) {
    if (e.charCode == 13) {
      if (e.target.value === '')
        $(event.target.parentNode).addClass('has-error');
      else
        $(event.target.parentNode).removeClass('has-error');
      if (!App.currentEvent)
        App.currentEvent = {};
      App.currentEvent.address = e.target.value;
      App.geocoder.query(App.currentEvent.address, App.showMap);
      e.stopPropagation();
      return false;
    }
  },
  'click #saveEvent': function(e, t) {
    ["title","msg"].map(removeHasError);
    ["title","msg"].map(checkEmpty);
    if (!$('.form-group.has-error').length) {
      // TODO: how to pass date time data.
      var url = '/event/Create' + '?' + $('input.form-control, textarea.form-control, input:checkbox').serialize();
      Router.go(url);
    }
    e.preventDefault();
  }
});

Template.calendar.events({
  'click .fc-button-agendaDay': function() {
    Meteor.users.update({_id:Meteor.userId()}, {$set:{"profile.calendarView":"agendaDay"}});
  },
  'click .fc-button-agendaWeek': function(e, t) {
    Meteor.users.update({_id:Meteor.userId()}, {$set:{"profile.calendarView":"agendaWeek"}});
  },
  'click .fc-button-month': function() {
    Meteor.users.update({_id:Meteor.userId()}, {$set:{"profile.calendarView":"month"}});
  }
});

Template.modal.events({
  'click #saveEvent': function(e, t) {
      ["title","msg"].map(removeHasError);
      ["title","msg"].map(checkEmpty);
      if (!$('.form-group.has-error').length){
        e.preventDefault();
        return;
      }
      var action = $("#current_evt_action").html();
      var event = void 0;
      var id = void 0;
      var url;
      event = {};
      if (action === "edit") {
        event = JSON.parse($("#current_evt_data").html());
        event.title = $("#title").val();
        event.desc = $("#msg").val();
        url = '/event/Update'
      } else {
        event.start = $("#eventStart").val();
        event.end = $("#eventEnd").val();
        event.allDay = $("#eventAllDay").val();
        event.title = $("#title").val();
        event.desc = $("#msg").val();
        url = '/event/Create'
      }
      url += '?' + serialize(event);
      Router.go(url);
      $("#myModal").modal("hide");
  },
  'click #deleteEvent': function(e, t) {
    event = JSON.parse($("#current_evt_data").html());
    if (event.ownerId === Meteor.userId()) {
      Events.remove({_id: event._id});
    } else {
      Events.update({_id: event._id}, {$pull: {partnerIds: Meteor.userId()}});
    }

    $("#myModal").modal("hide");
  },
  'click #shareEvent': function(e, t) {
    e.preventDefault();
    $("#myModal").modal("hide");
    $("#myEmailModal").modal("show");
  }
});

Template.emailModal.events({
  'click #sendEmail': function(e, t) {
    e.preventDefault();
    var event = JSON.parse($("#current_evt_data").html());
    var to = $('#email').val();
    var url = '/share/'+ event._id + '?' + 'to=' + to;
    console.log(url);
    Router.go(url);
    $("#myEmailModal").modal("hide");
  },
  'click #backEvent': function(e, t) {
    e.preventDefault();
    $("#myModal").modal("show");
    $("#myEmailModal").modal("hide");
  }
});

Template.loginForm.err = function () {
  return Session.get('err');
};

Template.loginForm.isPasswordError = function () {
  if (Session.get('err')) {
    return Session.get('err').reason.match(/password/ig);
  }
};

Template.loginForm.isUserError = function () {
  if (Session.get('err')) {
    return Session.get('err').reason.match(/user/ig);
  }
};

Template.loginForm.events({
  'submit': function(e, t) {
    e.preventDefault();
    if(t.find('input#creatingAccount')) {
      Session.set('creatingAccount', false);
      Accounts.createUser({
        username: t.find('#userName') ? t.find('#userName').value : '',
        email: t.find('#userEmail').value,
        password: t.find('#userPassword').value,
        profile: {
          name: t.find('#userName') ? t.find('#userName').value : ''
        }
      });
    } else {
      App.login({email: t.find('#userEmail').value, password: t.find('#userPassword').value});
    }
  },
  'click a#goLogin': function(e, t) {
    e.preventDefault();
    Session.set('creatingAccount', false);
  },
  'click a#goCreate': function(e, t) {
    e.preventDefault();
    Session.set('creatingAccount', true);
  }
});

Template.loginForm.creatingAccount = function() {
  return Session.get('creatingAccount');
};

var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
    return str.join("&");
};

var hasError = function (id) {

}

var checkEmpty = function(id) {
  if ($('#'+id).val() === '') {
    $('#'+id).parent().addClass('has-error')
  }
};

var removeHasError = function (id) {
  $('#'+id).parent().removeClass('has-error');
};