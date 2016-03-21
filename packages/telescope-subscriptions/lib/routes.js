FlowRouter.route('/manage-subscriptions/:subscriptionId', {
  name: 'subscriptionsManage',
  action: function(params, queryParams) {
    BlazeLayout.render('layout', { main: 'manage_subscriptions' } );
  }
});
