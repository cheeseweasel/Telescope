Template.manage_subscriptions.onCreated(function () {

  var sub = Telescope.subsManager.subscribe('subscription', FlowRouter.getParam("subscriptionId"));
  
});

Template.manage_subscriptions.helpers({
  emailAddress: function() {
    return subscription().subscribedEmail;
  },
  subscription: function() {
    return subscription();
  },
  subscriptionFields: function () {
    return Subscriptions.simpleSchema().getEditableFields(Meteor.user());
  }
});

var subscription = function() {
  return Subscriptions.findOne({_id: FlowRouter.getParam("subscriptionId")});
}
