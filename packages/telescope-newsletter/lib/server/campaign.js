defaultFrequency = 7;
defaultPosts = 5;

var avatarUrls = [];

getCampaignPosts = function (postsCount, filter) {

  filter = filter || {}

  // look for last scheduled campaign in the database
  var lastCampaign = SyncedCron._collection.findOne({name: 'scheduleNewsletter'}, {sort: {finishedAt: -1}, limit: 1});

  // if there is a last campaign use its date, else default to posts from the last 7 days
  var lastWeek = moment().subtract(7, 'days').toDate();
  var after = (typeof lastCampaign !== 'undefined') ? lastCampaign.finishedAt : lastWeek

  var params = Posts.parameters.get({
    view: 'campaign',
    limit: postsCount,
    after: after
  });

  for( var itm in filter ){
    params.find[itm] = filter[itm];
  }
  return Posts.find(params.find, params.options).fetch();
};

var verifyAvatarUrl = function(url){
  var cached = _.findWhere(avatarUrls, {'url': url});

  if( cached !== undefined ) { return cached.valid; }

  var obj = {'url': url, 'valid': true};

  try {
    HTTP.get(url);
  } catch (error) {
    obj.valid = false;
  }
  avatarUrls.push(obj);
  return obj.valid;
};

buildCampaign = function (postsArray) {

  var postsHTML = '', subject = '';

  // 1. Iterate through posts and pass each of them through a handlebars template
  postsArray.forEach(function (post, index) {
    if(index > 0)
      subject += ', ';

    subject += post.title;

    var postUser = Meteor.users.findOne(post.userId);

    // the naked post object as stored in the database is missing a few properties, so let's add them
    var properties = _.extend(post, {
      authorName: post.getAuthorName(),
      postLink: Posts.getLink(post, true),
      profileUrl: Users.getProfileUrl(postUser, true),
      postPageLink: Posts.getPageUrl(post, true),
      date: moment(post.postedAt).format("MMMM D YYYY"),
      authorAvatarUrl: Avatar.getUrl(postUser)
    });

    if(!verifyAvatarUrl(post.authorAvatarUrl)){
      post.authorAvatarUrl = false;
    }

    if (post.body) {
      properties.body = Telescope.utils.trimHTML(post.htmlBody, 20);
    }

    if (post.commentCount > 0) {
      properties.popularComments = Comments.find({postId: post._id}, {sort: {score: -1}, limit: 2, transform: function (comment) {
        var user = Meteor.users.findOne(comment.userId);

        comment.body = Telescope.utils.trimHTML(comment.htmlBody, 20);
        comment.authorProfileUrl = Users.getProfileUrl(user, true);
        comment.authorAvatarUrl = Avatar.getUrl(user);

        if(!verifyAvatarUrl(comment.authorAvatarUrl)){
          comment.authorAvatarUrl = false;
        }
        return comment;
      }}).fetch();
    }

    if(post.url) {
      properties.domain = Telescope.utils.getDomain(post.url);
    }

    if (properties.thumbnailUrl) {
      properties.thumbnailUrl = Telescope.utils.addHttp(properties.thumbnailUrl);
    }

    postsHTML += Telescope.email.getTemplate('emailPostItem')(properties);
  });

  // 2. Wrap posts HTML in digest template
  var digestHTML = Telescope.email.getTemplate('emailDigest')({
    siteName: Settings.get('title'),
    date: moment().format("dddd, MMMM Do YYYY"),
    content: postsHTML
  });

  // 3. wrap digest HTML in email wrapper template
  var emailHTML = Telescope.email.buildTemplate(digestHTML);

  var campaign = {
    postIds: _.pluck(postsArray, '_id'),
    subject: Telescope.utils.trimWords(subject, 15),
    html: emailHTML
  };

  return campaign;
};

scheduleNextCampaign = function (isTest) {
  isTest = !! isTest;
  var posts = getCampaignPosts(Settings.get('postsPerNewsletter', defaultPosts));
  if(!!posts.length){
    var campaign = scheduleCampaign(buildCampaign(posts), isTest);
    scheduleIndividualNewsletters();
    return campaign;
  }else{
    var result = 'No posts to schedule today…';
    return result;
  }
};

Meteor.methods({
  sendCampaign: function () {
    if(Users.is.adminById(this.userId))
      return scheduleNextCampaign(false);
  },
  testCampaign: function () {
    if(Users.is.adminById(this.userId))
      return scheduleNextCampaign(true);
  }
});
