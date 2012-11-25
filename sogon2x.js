var Posts = new Meteor.Collection('posts');
if (Meteor.isClient) {
  Meteor.autosubscribe(function() {
    Meteor.subscribe('posts', Session.get('page'), Meteor.user());
  });
  var sendSubmit = function () {
    var input = $('.postText');
    Meteor.call('postText', input.val(), Session.get('page'), function (err, result) {
      if (err) throw 'server error';
    });
    input.val('');
    return false;
  };
  Template.posts.posts=function() {
    return Posts.find({}, {sort:{created_at:-1}});
  };
  Template.main.events({
    'submit': function () {
      return this.sendSubmit();
    },
    'keydown .postText': function(e) {
      return (e.shiftKey && e.which === 13) && sendSubmit() || true;
    },
    'click .subscribe' : function () {
      Meteor.call('subscribe', Session.get('page'))
    },
    'click .unsubscribe' : function () {
      Meteor.call('unsubscribe', Session.get('page'))
    }
  });
  Template.main.pageTitle = function () {
    return Session.get('page');
  };
  Meteor.Router.add({
    '/':function () {
      Session.set('page', '');
      return 'title';
    },
    '/page/:page':function(page) {
      Session.set('page', page);
      return 'main';
    },
    '/mypage':function() {
      Session.set('page','');
      return 'mypage';
    }
  });
  Meteor.Router.filters({
    'login' : function() {
      if (Meteor.user()) {
        Session.set('page', '');
        return 'mypage';
      } else {
        return 'title';
      }
    }
  });
  Meteor.Router.filter('login', {only: 'title'});

  Handlebars.registerHelper('timeago',function(time) {
    return moment(time).from();
  });
  Template.main.helpers({
    'isSubscribe': function (subscribers) {
      return subscribers && subscribers[Session.get('page')];
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  Meteor.publish('posts', function (page, user) {
    return Posts.find(
      page && {page:page} || user && {
        page:{$in:
          _.map(user.profile && user.profile.subscribers, function(v,k) { return k; })
        }
      } || {},
      {sort:{created_at:-1}}
    );
  });
}

Meteor.methods({
  "postText": function(text, page) {
    if(text && page && Meteor.user()) {
      Posts.insert({'text':text,
        'page':page, 'author': Meteor.user(),
        'created_at': Date.now()
      });
    } else {
      throw "access denied";
    }
  },
  "subscribe": function(page) {
    var subscribers={};
    subscribers["profile.subscribers."+page]={
      dateTime:Date.now()
    };
    Meteor.users.update(this.userId, {$set:subscribers});
  },
  "unsubscribe": function(page) {
    var subscribers={};
    subscribers["profile.subscribers."+page]=false;
    Meteor.users.update(this.userId, {$unset:subscribers});
  }
});
